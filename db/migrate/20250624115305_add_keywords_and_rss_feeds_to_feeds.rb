class AddKeywordsAndRssFeedsToFeeds < ActiveRecord::Migration[5.2]
  def change
    add_column :feeds, :keywords, :text
    add_column :feeds, :rss_feeds, :text
  end
end
