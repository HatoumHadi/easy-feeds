class Api::CollectionsController < ApplicationController
  before_action :require_login

  # Create a new collection and add an item (profile or website)
  def create
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

  # Add an item to an existing collection
  def add_item
    collection = Collection.find(params[:id])
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

  private

  def collection_params
    params.require(:collection).permit(:name, :feeds)
  end

end
