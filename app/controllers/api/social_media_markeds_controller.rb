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
      )
      # Always update profile fields if provided
      updated = false
      if params[:display_name] && profile.display_name != params[:display_name]
        profile.display_name = params[:display_name]
        updated = true
      end
      if params[:profile_url] && profile.profile_url != params[:profile_url]
        profile.profile_url = params[:profile_url]
        updated = true
      end
      if params[:avatar_url] && profile.avatar_url != params[:avatar_url]
        profile.avatar_url = params[:avatar_url]
        updated = true
      end
      profile.save if updated

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
