class SocialMediaMarkedSerializer < ActiveModel::Serializer
  attributes :id, :user_id, :social_media_profile_id, :created_at
  belongs_to :social_media_profile
end
