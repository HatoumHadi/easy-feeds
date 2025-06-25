require 'feedjira'
require 'feed_favicon_helper'
require 'metainspector'

class Feed < ApplicationRecord
  attr_accessor :populate

  validates :rss_url, presence: true

  has_many  :subscriptions,
            foreign_key: :feed_id,
            class_name: :Subscription,
            dependent: :destroy

  has_many  :subscribers,
            through: :subscriptions,
            source: :subscriber

  has_many  :stories,
            foreign_key: :feed_id,
            class_name: :Story,
            dependent: :destroy

  before_validation :validate_feed, on: :create
  after_initialize :set_populate_default, if: :new_record?
  after_validation :populate_feed_metadata, on: :create, if: :should_populate?
  after_create :populate_entries, if: :should_populate?

  def self.popular
    Feed
      .order('subscriptions_count DESC')
      .limit(20)
  end

  def self.process_input(input)
    # First check if it's already a feed
    return input if rss_feed?(input)
    # Then check if it's a URL
    if url?(input)
      discover_feed_from_url(input) || create_page_feed(input)
    else
      # Otherwise treat as keywords
      create_search_feed(input)
    end
  end

  def validate_feed
    if rss_url.blank?
      errors.add(:base, 'The URL field cannot be empty')
      throw :abort
    end

    begin
      @feedjira_feed = fetch_and_parse(rss_url)
    rescue => e
      errors.add(:base, "Could not process this feed: #{e.message}")
      Rails.logger.error "Feed validation failed for #{rss_url}: #{e.message}"
      throw :abort
    end
  end

  def fetch_and_parse(rss_url)
    # First try to get the feed directly
    response = HTTParty.get(rss_url, headers: {
      "User-Agent" => "Mozilla/5.0",
      "Accept" => "application/rss+xml, application/atom+xml, application/xml, text/xml"
    })
    
    # Check if the response is valid XML
    if valid_xml?(response.body)
      begin
        parsed = Feedjira.parse(response.body)
        return parsed if parsed.respond_to?(:entries)
      rescue Feedjira::NoParserAvailable
        return parse_as_xml(response.body)
      end
    end

    # If not XML or parsing failed, try to discover the feed URL
    page = MetaInspector.new(rss_url, connection_timeout: 10, read_timeout: 10)
    discovered_feeds = page.feeds

    # Add CNN-specific feeds if relevant
    cnn_specific_feeds = []
    if rss_url.include?('cnn.com')
      cnn_specific_feeds = [
        'http://rss.cnn.com/rss/cnn_topstories.rss',
        'http://rss.cnn.com/rss/cnn_world.rss',
        'http://rss.cnn.com/rss/cnn_us.rss'
      ]
    end

    # Try common feed URLs if automatic discovery fails
    common_feed_paths = ['/feed', '/rss', '/atom.xml', '/feed.xml']
    all_possible_feeds = discovered_feeds + cnn_specific_feeds + common_feed_paths.map { |path| URI.join(rss_url, path).to_s }

    # Try each possible feed URL
    all_possible_feeds.each do |feed_url|
      next if feed_url.nil?
      begin
        feed_response = HTTParty.get(feed_url, headers: { "User-Agent" => "Mozilla/5.0" })
        if valid_xml?(feed_response.body)
          parsed = Feedjira.parse(feed_response.body)
          return parsed if parsed.respond_to?(:entries)
        end
      rescue => e
        Rails.logger.debug "Failed to parse #{feed_url}: #{e.message}"
        next
      end
    end

    raise "No valid feed found at #{rss_url}"
  rescue => e
    Rails.logger.error "Feed parsing error: #{e.message}"
    raise "Could not parse feed: #{e.message}"
  end

  private

  def valid_xml?(content)
    Nokogiri::XML(content).errors.empty?
  rescue
    false
  end

  def parse_as_xml(xml_content)
    doc = Nokogiri::XML(xml_content)
    
    feed = OpenStruct.new(
      title: doc.at_xpath('//title')&.text || "Untitled Feed",
      url: doc.at_xpath('//link')&.text || "",
      description: doc.at_xpath('//description')&.text || "",
      entries: []
    )

    doc.xpath('//item').each do |item|
      feed.entries << OpenStruct.new(
        title: item.at_xpath('title')&.text || "Untitled",
        url: item.at_xpath('link')&.text || "",
        summary: item.at_xpath('description')&.text || "",
        published: (Time.parse(item.at_xpath('pubDate')&.text) rescue Time.now),
        entry_id: Digest::SHA1.hexdigest(item.at_xpath('link')&.text || rand.to_s)
      )
    end

    feed
  end

  # Detection methods
  def self.rss_feed?(url)
    url.is_a?(String) && 
    (url.match?(/\.(rss|xml|atom|feed)(\?.*)?$/) ||
     url.match?(/\/feed\/?$/) ||
     url.match?(/feedburner/i))
  end

  def self.url?(input)
    input.is_a?(String) && 
    input.start_with?('http://', 'https://')
  end

  # Feed discovery methods
  def self.discover_feed_from_url(url)
    page = MetaInspector.new(url)
    page.feeds.first
  rescue
    nil
  end

  def self.create_page_feed(url)
    "feed://page/#{url}"
  end

  def self.create_search_feed(keywords)
    "feed://search/#{URI.encode_www_form_component(keywords)}"
  end

  # Parsing methods
  def parse_standard_feed(url)
    response = HTTParty.get(url, headers: { "User-Agent" => "Mozilla/5.0" })
    Feedjira.parse(response.body)
  end

  def parse_search_feed(feed_url)
    query = feed_url.split('/').last
    results = perform_web_search(query)

    build_feed_struct(
      title: "Search: #{query}",
      url: feed_url,
      description: "Search results for '#{query}'",
      entries: results.map do |result|
        build_entry_struct(
          title: result[:title],
          url: result[:url],
          content: result[:snippet]
        )
      end
    )
  end

  def parse_page_feed(feed_url)
    url = feed_url.split('/').last
    page = MetaInspector.new(url)

    build_feed_struct(
      title: page.best_title,
      url: url,
      description: page.best_description,
      entries: [
        build_entry_struct(
          title: page.best_title,
          url: url,
          content: page.best_description
        )
      ]
    )
  rescue
    # Fallback if page parsing fails
    build_feed_struct(
      title: "Webpage: #{url}",
      url: url,
      description: "Content from #{url}",
      entries: [
        build_entry_struct(
          title: "Webpage content",
          url: url,
          content: "Could not extract content from #{url}"
        )
      ]
    )
  end

  # Helper methods
  def build_feed_struct(title:, url:, description:, entries:)
    OpenStruct.new(
      title: title,
      url: url,
      description: description,
      entries: entries
    )
  end

  def build_entry_struct(title:, url:, content:, published: Time.now)
    OpenStruct.new(
      title: title,
      url: url,
      content: content,
      summary: content,
      published: published,
      entry_id: Digest::SHA1.hexdigest(url)
    )
  end

  def perform_web_search(query)
    # Replace with actual search API implementation
    [
      {
        title: "First result for #{query}",
        url: "https://example.com/search?q=#{query}",
        snippet: "Top result about #{query}"
      },
      {
        title: "Second result for #{query}",
        url: "https://example.com/articles/#{query.parameterize}",
        snippet: "More information about #{query}"
      }
    ]
  end

  def set_populate_default
    @populate = true if new_record?
  end

  def should_populate?
    @populate == true
  end

  def populate_feed_metadata
    @feedjira_feed ||= fetch_and_parse(rss_url)

    self.title = @feedjira_feed.title.presence || "New Feed"
    self.website_url = @feedjira_feed.url
    self.description = @feedjira_feed.description || "#{@feedjira_feed.title}: #{@feedjira_feed.url}"
    self.last_built = Time.now

    host = URI(@feedjira_feed.url).host
    self.favicon_url = Favicon.new(host).uri || 'https://i.imgur.com/hGzwKc1.png'
    self.image_url = favicon_url
  end

  def populate_entries
    @feedjira_feed ||= fetch_and_parse(rss_url)

    @feedjira_feed.entries.each do |entry|
      unless stories.exists?(entry_id: entry.entry_id)
        Story.create_from_entry_and_feed(entry, self)
      end
    end

    update(last_built: @feedjira_feed.entries.map { |ent| ent.published || Time.now }.max)
  end
end
