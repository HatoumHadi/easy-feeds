# content_extractor.rb - Enhanced with FiveFilters RSS conversion
require 'nokogiri'
require 'fastimage'
require 'time'
require 'uri'
require 'net/http'
require 'json'
require 'feedjira'

class ContentExtractor
  FIVEFILTERS_API_ENDPOINT = 'https://createfeed.fivefilters.org/index.php'.freeze

  def initialize(page)
    @page = page
    @doc = page.parsed
    @base_url = page.url
    @domain = extract_domain(@base_url)
  end

  def extract_articles
    # Try FiveFilters API first to convert to RSS
    articles = extract_using_fivefilters ||
               extract_using_semantic_markup ||
               extract_using_generic_patterns ||
               extract_using_intelligent_detection ||
               []

    articles.map { |article| standardize_article(article) }
  end

  private

  def extract_using_fivefilters
    begin
      # Build the API request URL
      uri = URI.parse(FIVEFILTERS_API_ENDPOINT)
      uri.query = URI.encode_www_form(url: @base_url)

      # Make the HTTP request
      response = Net::HTTP.get_response(uri)

      if response.is_a?(Net::HTTPSuccess)
        feed_xml = response.body
        return parse_rss_feed(feed_xml)
      else
        Rails.logger.error "FiveFilters API failed with status: #{response.code}"
      end
    rescue => e
      Rails.logger.error "FiveFilters API request failed: #{e.message}"
    end

    nil
  end

  def parse_rss_feed(feed_xml)
    feed = Feedjira.parse(feed_xml)
    
    feed.entries.map do |entry|
      {
        title: entry.title,
        url: entry.url,
        summary: entry.summary,
        content: entry.content || entry.summary,
        published: entry.published || entry.updated || Time.now,
        entry_id: entry.entry_id || Digest::MD5.hexdigest(entry.url),
        image_url: extract_image_from_entry(entry)
      }
    end
  rescue => e
    Rails.logger.error "Failed to parse RSS feed: #{e.message}"
    nil
  end

  def extract_image_from_entry(entry)
    # Try to extract image from enclosure if available
    if entry.respond_to?(:enclosure) && entry.enclosure
      return entry.enclosure.url if entry.enclosure.type.start_with?('image/')
    end

    # Try to extract first image from content
    if entry.content
      doc = Nokogiri::HTML(entry.content)
      img = doc.css('img').first
      return img['src'] if img
    end

    nil
  end

  def extract_domain(url)
    URI.parse(url).host.downcase rescue nil
  end

  def extract_using_semantic_markup
    articles = []
    
    # Schema.org microdata
    @doc.css('[itemtype*="Article"], [itemtype*="NewsArticle"], [itemtype*="BlogPosting"]').each do |article|
      title = article.css('[itemprop="headline"]').text.presence || 
              article.css('h1, h2, h3').first&.text&.strip
      
      url_elem = article.css('[itemprop="url"]').first || 
                 article.css('a').first
      
      next unless title && url_elem
      
      articles << {
        title: title,
        url: make_absolute(url_elem['href'] || url_elem.text),
        summary: article.css('[itemprop="description"]').text.presence,
        published: parse_date(article.css('[itemprop="datePublished"]').text),
        content: article.css('[itemprop="articleBody"]').to_html.presence,
        image_url: article.css('[itemprop="image"]').first&.[]('src')
      }
    end
    
    # JSON-LD structured data
    json_ld_articles = extract_json_ld_articles
    articles.concat(json_ld_articles) if json_ld_articles
    
    # Open Graph data
    og_articles = extract_open_graph_articles
    articles.concat(og_articles) if og_articles
    
    articles.any? ? articles : nil
  end

  def extract_json_ld_articles
    articles = []
    
    @doc.css('script[type="application/ld+json"]').each do |script|
      begin
        data = JSON.parse(script.content)
        data = [data] unless data.is_a?(Array)
        
        data.each do |item|
          next unless item['@type']&.include?('Article')
          
          articles << {
            title: item['headline'],
            url: make_absolute(item['url']),
            summary: item['description'],
            published: parse_date(item['datePublished']),
            image_url: item.dig('image', 'url') || item['image']
          }
        end
      rescue JSON::ParserError => e
        Rails.logger.debug "JSON-LD parsing failed: #{e.message}"
      end
    end
    
    articles.compact
  end

  def extract_open_graph_articles
    title = @doc.css('meta[property="og:title"]').first&.[]('content')
    url = @doc.css('meta[property="og:url"]').first&.[]('content')
    description = @doc.css('meta[property="og:description"]').first&.[]('content')
    image = @doc.css('meta[property="og:image"]').first&.[]('content')
    
    return nil unless title
    
    [{
      title: title,
      url: make_absolute(url || @base_url),
      summary: description,
      image_url: image
    }]
  end

  def extract_using_generic_patterns
    generic_patterns = [
      { container: 'article', title: 'h1, h2, h3, .title, .headline', url: 'a', summary: 'p', image: 'img' },
      { container: '.post', title: '.entry-title, .post-title, h1, h2', url: 'a', summary: '.excerpt, .summary', image: 'img' },
      { container: '.story', title: 'h2, h3, .story-title', url: 'a', summary: '.story-summary', image: 'img' },
      { container: '.news-item', title: '.title, h3', url: 'a', summary: '.description', image: 'img' }
    ]

    generic_patterns.each do |pattern|
      articles = extract_using_pattern(pattern)
      return articles if articles&.any?
    end
    nil
  end

  def extract_using_pattern(pattern)
    articles = []
    
    @doc.css(pattern[:container]).each do |item|
      title_element = item.css(pattern[:title]).first
      link_element = item.css(pattern[:url]).first
      
      next unless title_element && link_element
      
      article = {
        title: title_element.text.strip,
        url: make_absolute(link_element['href']),
        summary: item.css(pattern[:summary]).first&.text&.strip,
        image_url: item.css(pattern[:image]).first&.[]('src')
      }
      
      articles << article if article[:title].present? && article[:url].present?
    end
    
    articles.any? ? articles : nil
  end

  def extract_using_intelligent_detection
    potential_containers = detect_article_containers
    
    articles = []
    potential_containers.each do |container|
      article = extract_from_container(container)
      articles << article if article
    end
    
    articles.any? ? articles : nil
  end

  def detect_article_containers
    containers = []
    
    %w[article div section li].each do |tag|
      @doc.css(tag).each do |element|
        score = score_element_as_article_container(element)
        containers << { element: element, score: score } if score > 0.5
      end
    end
    
    containers.sort_by { |c| -c[:score] }
             .first(10)
             .map { |c| c[:element] }
  end

  def score_element_as_article_container(element)
    score = 0.0
    
    class_names = element['class'].to_s.downcase
    article_keywords = %w[article post story news item card entry blog]
    score += 0.3 if article_keywords.any? { |keyword| class_names.include?(keyword) }
    
    score += 0.2 if element.css('h1, h2, h3, h4').any?
    score += 0.2 if element.css('a').any?
    
    text_length = element.text.strip.length
    score += 0.1 if text_length > 50 && text_length < 1000
    
    depth = element.ancestors.length
    score -= 0.1 if depth > 10
    
    score
  end

  def extract_from_container(container)
    title_element = container.css('h1, h2, h3, h4, .title, .headline').first
    return nil unless title_element
    
    link_element = title_element.css('a').first || 
                   container.css('a').first
    return nil unless link_element
    
    paragraphs = container.css('p')
    summary = paragraphs.first&.text&.strip
    
    image = container.css('img').first
    
    {
      title: title_element.text.strip,
      url: make_absolute(link_element['href']),
      summary: summary,
      image_url: image&.[]('src')
    }
  end

  def standardize_article(article)
    {
      title: article[:title]&.strip || "Untitled Article",
      url: make_absolute(article[:url] || @base_url),
      summary: article[:summary]&.strip || "",
      content: article[:content] || "",
      published: article[:published] || Time.now,
      entry_id: article[:entry_id] || generate_entry_id(article),
      image_url: article[:image_url]
    }
  end

  def make_absolute(url)
    return url if url.nil? || url.start_with?('http')
    URI.join(@base_url, url).to_s
  rescue URI::InvalidURIError => e
    Rails.logger.debug "Invalid URL: #{url} - #{e.message}"
    @base_url
  end

  def generate_entry_id(article)
    Digest::MD5.hexdigest("#{article[:url]}#{article[:title]}")
  end

  def parse_date(str)
    return nil if str.blank?
    
    formats = [
      '%Y-%m-%d',
      '%Y/%m/%d',
      '%d-%m-%Y',
      '%d/%m/%Y',
      '%Y-%m-%dT%H:%M:%S',
      '%Y-%m-%d %H:%M:%S'
    ]
    
    formats.each do |format|
      begin
        return Time.strptime(str, format)
      rescue ArgumentError
        next
      end
    end
    
    Time.parse(str)
  rescue => e
    Rails.logger.debug "Date parsing failed for '#{str}': #{e.message}"
    nil
  end
end