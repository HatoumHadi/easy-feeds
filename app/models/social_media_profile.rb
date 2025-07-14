# == Schema Information
# Table name: social_media_profiles
#
#  id         :bigint           not null, primary key
#  ...        :other columns
#

class SocialMediaProfile < ApplicationRecord
  has_many :social_media_markeds, dependent: :destroy
  has_many :marked_by_users, through: :social_media_markeds, source: :user
end
