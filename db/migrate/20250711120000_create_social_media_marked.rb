class CreateSocialMediaMarked < ActiveRecord::Migration[5.2]
  def change
    create_table :social_media_markeds do |t|
      t.references :user, null: false, foreign_key: true
      t.references :social_media_profile, null: false, foreign_key: true
      t.timestamps
    end
    add_index :social_media_markeds, [:user_id, :social_media_profile_id], unique: true, name: 'index_social_media_markeds_on_user_and_profile'
  end
end
