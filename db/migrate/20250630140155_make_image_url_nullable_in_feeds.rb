class MakeImageUrlNullableInFeeds < ActiveRecord::Migration[5.2]
  def change
    change_column_null :feeds, :image_url, true
  end
end