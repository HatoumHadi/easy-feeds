Rails.application.routes.draw do

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root to: 'static_pages#root'

  namespace :api, defaults: { format: :json } do
    resources :users, only: [:create, :show]
    resource :session, only: [:create, :destroy]
    resources :subscriptions, only: [:create, :index, :show, :destroy, :update] do
      collection do
        post 'subscribe_existing_feed', to: 'subscriptions#subscribe_existing_feed'
      end
    end
    resources :feeds, only: [:index, :show, :create] do
      member do
        delete 'remove_from_collections', to: 'feeds#remove_from_collections'
      end
    end
    resources :stories, only: [:index, :show]
    resources :collections, only: [:create, :update, :destroy, :index] do
      post 'add_items', on: :member
      delete 'remove_item', on: :member
      collection do
        get 'with_feeds_and_social_media_profiles', to: 'collections#with_feeds_and_social_media_profiles'
      end
    end
    resources :reads, only: [:create, :destroy, :index]
    get 'instagram_avatar/:username', to: 'instagram_avatar#show'
    resources :social_media_markeds, only: [:index, :create]
    delete 'social_media_markeds', to: 'social_media_markeds#destroy'
  end

end
