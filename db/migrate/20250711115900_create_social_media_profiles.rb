class CreateSocialMediaProfiles < ActiveRecord::Migration[5.2]
  def change
    create_table :social_media_profiles do |t|
      t.string :platform, null: false
      t.string :username, null: false
      t.string :display_name
      t.string :profile_url
      t.string :avatar_url
      t.timestamps
    end
    add_index :social_media_profiles, [:platform, :username], unique: true
  end
end
