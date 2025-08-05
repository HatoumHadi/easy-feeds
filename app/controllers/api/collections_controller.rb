class Api::CollectionsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :require_login

  # Create a new collection and add an item (profile or website)
  def create
    # Prevent duplicate collection names for the same user
    existing = Collection.find_by(name: params[:name], creator_id: current_user.id)
    if existing
      render json: { error: ["Collection with this name already exists."] }, status: :unprocessable_entity
      return
    end
    collection = Collection.new(name: params[:name], creator_id: current_user.id)
    if collection.save
      item = CollectionItem.create(
        collection: collection,
        item_type: params[:item_type],
        item_id: params[:item_id]
      )
      render json: { id: collection.id, name: collection.name, item: item }, status: :created
    else
      render json: { error: collection.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # POST /api/collections/:id/remove_item
  def remove_item
    collection = Collection.find(params[:id])
    item_type = params[:item_type]
    item_id = params[:item_id]

    case item_type
    when 'feed', 'Feed'
      collection_item = collection.collection_items.find_by(item_type: 'Feed', item_id: item_id)
    when 'profile', 'social_profile', 'social media', 'SocialMediaProfile'
      collection_item = collection.collection_items.find_by(item_type: 'SocialMediaProfile', item_id: item_id)
    else
      render json: { error: 'Invalid item_type' }, status: :unprocessable_entity and return
    end

    if collection_item&.destroy
      render json: { success: true }
    else
      render json: { error: 'Could not remove item' }, status: :unprocessable_entity
    end
  end
  # Add an item to an existing collection
  def add_items
    collection = Collection.find(params[:id])
    existing_item = CollectionItem.find_by(
      collection: collection,
      item_type: params[:item_type],
      item_id: params[:item_id]
    )

    if existing_item
      render json: { success: false, message: "Item already exists in this collection.", item: existing_item }, status: :ok
    else
      item = CollectionItem.create(
        collection: collection,
        item_type: params[:item_type],
        item_id: params[:item_id]
      )
      if item.persisted?
        render json: { success: true, item: item }, status: :ok
      else
        render json: { error: item.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end



  # List all collections for the current user
  def index
    collections = Collection.where(creator_id: current_user.id)
    render json: collections
  end

  # List all collections with their feed and social media profile items for the current user
  def with_feeds_and_social_media_profiles
    collections = Collection.with_feed_and_social_media_profiles_items.where(creator_id: current_user.id)
    render json: collections
  end

  private

  def collection_params
    params.require(:collection).permit(:name, :feeds)
  end

end
