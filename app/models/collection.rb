class Collection < ApplicationRecord
  validates :creator_id, :name, presence: true
  validates :creator_id, uniqueness: { scope: :name }

  belongs_to :creator,
    foreign_key: :creator_id,
    class_name: :User

  has_many :collection_assignments,
    foreign_key: :collection_id,
    class_name: :CollectionAssignment

  has_many :subscriptions,
    through: :collection_assignments,
    source: :subscription

  has_many :stories,
    through: :subscriptions,
    source: :stories

  has_many :feeds,
    through: :subscriptions,
    source: :feed
  has_many :collection_items, dependent: :destroy
  validates :name, presence: true

  # Returns collections with their collection_items and joined feeds and social media profiles (if item_type is 'Feed' or 'Social Media')
  scope :with_feed_and_social_media_profiles_items, -> {
    joins("JOIN collection_items ON collection_items.collection_id = collections.id")
      .joins("LEFT JOIN feeds ON collection_items.item_type = 'Feed' AND feeds.id = collection_items.item_id")
      .joins("LEFT JOIN social_media_profiles ON collection_items.item_type = 'SocialMediaProfile' AND social_media_profiles.id = collection_items.item_id")
      .select(<<-SQL.squish)
        collections.*, 
        collection_items.id as collection_item_id, 
        collection_items.item_type as collection_item_type, 
        collection_items.item_id as collection_item_item_id, 
        feeds.id as feed_id, feeds.title as feed_title, feeds.rss_url as feed_rss_url, feeds.description as feed_description, feeds.favicon_url as feed_favicon_url, 
        social_media_profiles.id as social_profile_id, social_media_profiles.username as social_profile_username, social_media_profiles.platform as social_profile_platform, social_media_profiles.avatar_url as social_profile_avatar_url
      SQL
  }
end

# Example method to get all collections with their feed and social media profile items (as ActiveRecord objects)
def self.collections_with_feeds_and_social_media_profiles
  with_feed_and_social_media_profiles_items
end
