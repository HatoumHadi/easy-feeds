# Instagram Avatar Proxy Controller
class Api::InstagramAvatarController < ApplicationController
  require 'open-uri'
  require 'net/http'
  require 'json'

  # GET /api/instagram_avatar/:username
  def show
    username = params[:username]
    # Try to fetch the profile page and extract the avatar URL
    begin
      url = "https://www.instagram.com/#{username}/?__a=1&__d=dis"
      uri = URI(url)
      req = Net::HTTP::Get.new(uri)
      req['User-Agent'] = 'Mozilla/5.0 (compatible; easy-feeds/1.0)'
      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
      if res.code.to_i == 200
        json = JSON.parse(res.body)
        # Instagram's public API is unstable, try both v1 and v2
        avatar_url = json.dig('graphql', 'user', 'profile_pic_url_hd') || json.dig('user', 'profile_pic_url_hd')
        if avatar_url
          # Proxy the image
          image = URI.open(avatar_url, 'rb', { 'User-Agent' => 'Mozilla/5.0' })
          send_data image.read, type: image.content_type, disposition: 'inline'
          return
        end
      end
    rescue => e
      Rails.logger.warn("Instagram avatar fetch failed: #{e}")
    end
    # Fallback: 404
    head :not_found
  end
end
