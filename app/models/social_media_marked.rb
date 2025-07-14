class SocialMediaMarked < ApplicationRecord
  belongs_to :user
  belongs_to :social_media_profile

  validates :user_id, uniqueness: { scope: :social_media_profile_id }
end
