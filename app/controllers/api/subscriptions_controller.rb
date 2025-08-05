class Api::SubscriptionsController < ApplicationController
  before_action :require_login

    # POST /api/subscriptions/subscribe_existing_feed
  def subscribe_existing_feed
    feed_id = params[:feed_id]
    feed = Feed.find_by(id: feed_id)
    unless feed
      render json: ["Feed not found."], status: 404 and return
    end
    # Check if already subscribed
    existing = current_user.subscriptions.find_by(feed_id: feed.id)
    if existing
      render json: ["Already subscribed."], status: 422 and return
    end
    subscription = current_user.subscriptions.build(feed_id: feed.id)
    if subscription.save
      @subscription = subscription
      render :show
    else
      render json: subscription.errors.full_messages, status: 422
    end
  end

  def index
    @subscriptions ||= current_user.subscriptions.includes(:feed)
  end

  def show
    @subscription = current_user.subscription_by_feed(params[:id])
    if @subscription
      render :show
    else
      render json: ["Subscription not found."], status: 404
    end
  end

  def update
    @subscription = current_user.subscriptions.find_by(id: params[:id])
    if @subscription.update(subscription_params)
      render 'api/subscriptions/show_no_stories'
    else
      render json: @subscription.errors.full_messages, status: 422
    end
  end

  def create
    @subscription = Subscription.build_by_rss_url(
      rss_url: subscription_params[:rss_url],
      subscriber: current_user
    )

    if @subscription.is_a?(Feed) && @subscription.errors.any?
      render json: @subscription.errors.full_messages, status: 422
    elsif @subscription.save
      render :show
    else
      render json: @subscription.errors.full_messages, status: 422
    end
  end

  def destroy
    @subscription = current_user.subscriptions.find_by(id: params[:id])
    if @subscription
      @subscription.destroy!
      render :show
    else
      render json: ["Subscription no longer exists"], status: 404
    end
  end

  def refresh
    @subscription = current_user.subscriptions.find_by(feed_id: params[:id])
    @subscription = @subscription.feed.populate_entries if @subscription
  end

  def refresh_all
    @subs = current_user.subscriptions.includes(:feed, :stories)
    @subs.each(&:populate_entries)
  end

  private

  def subscription_params
    params.require(:subscription).permit(:id, :rss_url, :title)
  end
end