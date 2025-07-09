require 'feedjira'
require 'feed_favicon_helper'
require 'metainspector'
require 'addressable/uri'

class Feed < ApplicationRecord
  attr_accessor :populate

  SOCIAL_MEDIA_DOMAINS = [
    'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
    'youtube.com', 't.me', 'telegram.me', 'pinterest.com', 'snapchat.com',
    'tiktok.com', 'threads.net', 'reddit.com', 'whatsapp.com', 'github.com'
  ]

  serialize :social_links, Array
  serialize :website_links, Array

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
  after_initialize :initialize_link_attributes
  after_validation :populate_feed_metadata, on: :create, if: :should_populate?
  after_create :populate_entries, if: :should_populate?

  def initialize_link_attributes
    self.social_links ||= []
    self.website_links ||= []
  end

  def self.popular
    Feed.order('subscriptions_count DESC').limit(20)
  end

  def self.process_input(input)
    return input if rss_feed?(input)
    if url?(input)
      discover_feed_from_url(input) || create_page_feed(input)
    else
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
      errors.add(:base, "We couldn't find an RSS feed at this URL. Try a direct feed URL or contact support if you believe this is an error.")
      Rails.logger.error "Feed validation failed for #{rss_url}: #{e.message}"
      throw :abort
    end
  end

  def fetch_and_parse(rss_url)
    url = normalize_url(rss_url.strip)
    
    # Try direct parsing first
    direct_feed = try_direct_feed(url)
    return direct_feed if direct_feed

    # Try to discover feeds from page
    discovered_feed = try_discover_feeds(url)
    return discovered_feed if discovered_feed

    # Try common feed paths
    common_feed = try_common_feed_paths(url)
    return common_feed if common_feed

    # If all else fails, try to create a page feed
    create_page_feed(url)
  rescue => e
    Rails.logger.error "Feed parsing error: #{e.message}"
    raise "Could not parse feed: #{e.message}"
  end

  def try_common_feed_paths(url)
    common_paths = [
      '/feed', '/rss', '/atom.xml', '/feed.xml', 
      '/.rss', '/rss.xml', '/feed/rss', '/feed/atom',
      '/xml/rss', '/services/rss', '/content/rss',
      '/rss/all', '/feeds/posts/default'
    ]

    common_paths.each do |path|
      feed_url = make_absolute_url(url, path)
      feed = try_direct_feed(feed_url)
      return feed if feed
    end
    nil
  end

  def extract_website_metadata(url)
    begin
      page = MetaInspector.new(url,
        connection_timeout: 15,
        read_timeout: 15,
        headers: {
          'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language' => 'en-US,en;q=0.9,ar;q=0.8'
        }
      )
      
      {
        title: page.best_title,
        description: page.description,
        images: page.images.best,
        links: page.links,
        social_links: page.links.select { |link| SOCIAL_MEDIA_DOMAINS.any? { |domain| link.include?(domain) } }
      }
    rescue => e
      Rails.logger.error "Website metadata extraction failed: #{e.message}"
      nil
    end
  end

  def populate_feed_metadata
    @feedjira_feed ||= fetch_and_parse(rss_url)
    website_metadata = extract_website_metadata(website_url || rss_url)

    self.social_links ||= []
    self.website_links ||= []

    self.title = @feedjira_feed.title.presence || website_metadata.try(:[], :title) || "New Feed"
    self.website_url = @feedjira_feed.url.presence || rss_url
    self.description = @feedjira_feed.description || website_metadata.try(:[], :description) || "#{title}: #{website_url}"
    self.last_built = Time.now

    begin
      host = Addressable::URI.parse(self.website_url).host
      self.favicon_url = host ? Favicon.new(host).uri : 'https://i.imgur.com/hGzwKc1.png'
    rescue
      self.favicon_url = 'https://i.imgur.com/hGzwKc1.png'
    end
    self.image_url = website_metadata.try(:[], :images) || favicon_url

    if website_metadata
      self.website_links = website_metadata[:links].to_a.reject { |link| 
        website_metadata[:social_links].to_a.include?(link) 
      }.uniq
      self.social_links = website_metadata[:social_links].to_a.uniq
    end
  end

  def normalize_url(url)
    return "http://#{url}" unless url.start_with?('http')
    url
  end

  def try_direct_feed(url)
    begin
      response = HTTParty.get(url, headers: {
        "User-Agent" => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept" => "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "Accept-Language" => "en-US,en;q=0.9,ar;q=0.8"
      }, timeout: 15, follow_redirects: true, limit: 5)

      if valid_feed_content?(response.body)
        parsed = Feedjira.parse(response.body)
        return parsed if parsed.respond_to?(:entries)
      end
    rescue HTTParty::RedirectionTooDeep => e
      Rails.logger.warn "Direct feed attempt failed for #{url}: Too many redirects. Skipping to discovery."
      return nil
    rescue => e
      Rails.logger.warn "Direct feed attempt failed for #{url}: #{e.message}"
      return nil
    end
    nil
  end

  def try_discover_feeds(url)
    page = MetaInspector.new(url, 
      connection_timeout: 15, 
      read_timeout: 15,
      headers: {
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language' => 'en-US,en;q=0.9,ar;q=0.8'
      }
    )
    
    page.feeds.each do |feed_info|
      next unless feed_info.is_a?(Hash) && feed_info[:href]
      begin
        feed_url = make_absolute_url(url, feed_info[:href])
        feed = try_direct_feed(feed_url)
        return feed if feed
      rescue URI::InvalidURIError => e
        Rails.logger.warn "Invalid feed URL: #{feed_info[:href]} - #{e.message}"
        next
      end
    end
    
    nil
  rescue => e
    Rails.logger.error "Feed discovery failed for #{url}: #{e.message}"
    nil
  end

  def make_absolute_url(base_url, path)
    base_uri = Addressable::URI.parse(base_url)
    path_uri = Addressable::URI.parse(path)
    
    if path_uri.relative?
      base_uri.join(path).normalize.to_s
    else
      path
    end
  rescue Addressable::URI::InvalidURIError => e
    Rails.logger.warn "URL construction failed: #{base_url} + #{path} - #{e.message}"
    path
  end

  def valid_feed_content?(content)
    return false if content.nil? || content.empty?
    
    content.include?('<rss') || 
    content.include?('<feed') || 
    content.include?('<rdf:RDF') || 
    valid_xml?(content)
  end

  def valid_xml?(content)
    Nokogiri::XML(content).errors.empty?
  rescue
    false
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

  def set_populate_default
    @populate = true if new_record?
  end

  def should_populate?
    @populate == true
  end

  def self.create_page_feed(url)
    feed = new(rss_url: url)
    feed.populate = true
    feed.save!
    feed
  rescue => e
    Rails.logger.error "Failed to create page feed: #{e.message}"
    nil
  end
end