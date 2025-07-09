class AddSocialLinksAndWebsiteLinksToFeeds < ActiveRecord::Migration[5.2]
  def change
    add_column :feeds, :social_links, :text, array: true, default: []
    add_column :feeds, :website_links, :text, array: true, default: []
  end
end