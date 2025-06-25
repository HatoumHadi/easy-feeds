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
      errors.add(:base, "This website doesn't appear to have a valid RSS feed. Try a direct feed URL.")
      Rails.logger.error "Feed validation failed for #{rss_url}: #{e.message}"
      throw :abort
    end
  end

  def fetch_and_parse(rss_url)
    # Normalize URL
    url = rss_url.strip
    url = "https://#{url}" unless url.start_with?('http')

    # Try direct parsing first
    direct_feed = try_direct_feed(url)
    return direct_feed if direct_feed

    # Try known feed URLs for major sites
    known_feed = try_known_feeds(url)
    return known_feed if known_feed

    # Try to discover feeds
    discovered_feed = try_discover_feeds(url)
    return discovered_feed if discovered_feed

    raise "No valid feed found at #{url}"
  rescue => e
    Rails.logger.error "Feed parsing error: #{e.message}"
    raise "Could not parse feed: #{e.message}"
  end

  private

  def try_direct_feed(url)
    response = HTTParty.get(url, headers: { 
      "User-Agent" => "Mozilla/5.0",
      "Accept" => "application/rss+xml, application/atom+xml, application/xml, text/xml"
    })
    
    if valid_xml?(response.body)
      parsed = Feedjira.parse(response.body)
      return parsed if parsed.respond_to?(:entries)
    end
  rescue
    nil
  end

  def try_known_feeds(url)
    # Handle specific sites with known feed URLs
    case url
    when /nytimes\.com/i
      try_nytimes_feeds(url)
    when /cnn\.com/i
      try_cnn_feeds(url)
    else
      nil
    end
  end

  def try_nytimes_feeds(url)
    nyt_feeds = [
      'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      'https://rss.nytimes.com/services/xml/rss/nyt/US.xml'
    ]
    
    nyt_feeds.each do |feed_url|
      feed = try_direct_feed(feed_url)
      return feed if feed
    end
    nil
  end

  def try_cnn_feeds(url)
    cnn_feeds = [
      'http://rss.cnn.com/rss/cnn_topstories.rss',
      'http://rss.cnn.com/rss/cnn_world.rss',
      'http://rss.cnn.com/rss/cnn_us.rss',
      'https://edition.cnn.com/services/rss/'
    ]
    
    cnn_feeds.each do |feed_url|
      feed = try_direct_feed(feed_url)
      return feed if feed
    end
    nil
  end

  def try_discover_feeds(url)
    page = MetaInspector.new(url, connection_timeout: 10, read_timeout: 10)
    
    # Try discovered feeds first
    page.feeds.each do |feed_info|
      next unless feed_info.is_a?(Hash) && feed_info[:href]
      begin
        feed_url = URI(feed_info[:href]).to_s
        feed = try_direct_feed(feed_url)
        return feed if feed
      rescue URI::InvalidURIError
        next
      end
    end

    # Try common feed paths
    common_paths = ['/feed', '/rss', '/atom.xml', '/feed.xml', '/.rss']
    common_paths.each do |path|
      feed_url = URI.join(url, path).to_s
      feed = try_direct_feed(feed_url)
      return feed if feed
    end
    
    nil
  rescue
    nil
  end

  def valid_xml?(content)
    Nokogiri::XML(content).errors.empty?
  rescue
    false
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

  def set_populate_default
    @populate = true if new_record?
  end

  def should_populate?
    @populate == true
  end
end
