class Api::FeedsController < ApplicationController
  before_action :require_login

  # DELETE /api/feeds/:id/remove_from_collections
  def remove_from_collections
    feed_id = params[:id]
    removed = CollectionItem.where(item_type: 'Feed', item_id: feed_id).destroy_all
    render json: { success: true, removed_count: removed.size }
  end

  # POST /api/feeds
  def create
    @feed = Feed.find_by(rss_url: feed_params[:rss_url])
    if @feed
      render json: @feed, status: :ok
      return
    end

    @feed = Feed.new(feed_params)
    if @feed.save
      # Optionally, populate stories if your Feed model does this automatically
      render json: @feed, status: :created
    else
      render json: { errors: @feed.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def index
    sql_join = "LEFT OUTER JOIN subscriptions
    ON subscriptions.feed_id = feeds.id
    AND subscriptions.subscriber_id = #{current_user.id}"

    if params[:q].try(:empty?)
      @feeds = Feed.popular
        .select("feeds.*, subscriptions.subscriber_id as followed")
        .where("subscriptions.subscriber_id IS NULL")
        .joins(sql_join)
    else
      @q = Feed.ransack(title_or_rss_url_or_description_cont: params[:q])
      @feeds = @q.result
        .select("feeds.*, subscriptions.subscriber_id as followed")
        .joins(sql_join)
        .limit(20)
    end
  end

  def show
    @feed = Feed
      .includes(:stories, :subscriptions)
      .find_by(id: params[:id])
    
    if @feed && (@feed.website_links.blank? || @feed.social_links.blank?)
      @feed.populate_feed_metadata
      @feed.save if @feed.changed?
    end
    
    render :show
  end

  private

  def ensure_feed
    @feed = Feed.find_by(rss_url: feed_params[:rss_url])

    if @feed.nil?
      @feed = Feed.new(rss_url: feed_params[:rss_url])
      unless @feed.save
        render json: @feed.errors.full_messages, status: 422
      end
    end
  end

  def feed_params
    params.require(:feed).permit(:rss_url, :title)
  end
end