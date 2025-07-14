module Api
  class SocialMediaMarkedsController < ApplicationController
before_action :require_login
    skip_before_action :verify_authenticity_token

    def index
      @marked_profiles = current_user.social_media_markeds.includes(:social_media_profile)
      render json: @marked_profiles, include: :social_media_profile
    end

    def create
      # Find or create the social media profile
      profile = SocialMediaProfile.find_or_create_by(
        platform: params[:platform],
        username: params[:username]
      ) do |p|
        p.display_name = params[:display_name]
        p.profile_url = params[:profile_url]
        p.avatar_url = params[:avatar_url]
      end

      @marked = current_user.social_media_markeds.new(social_media_profile_id: profile.id)
      if @marked.save
        render json: @marked, status: :created
      else
        render json: @marked.errors, status: :unprocessable_entity
      end
    end

    def destroy
      @marked = current_user.social_media_markeds.find_by(social_media_profile_id: params[:social_media_profile_id])
      if @marked&.destroy
        head :no_content
      else
        render json: { error: 'Not found' }, status: :not_found
      end
    end
  end
end
