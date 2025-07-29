# Load custom API version constraint
require 'api_version_constraint'

Rails.application.routes.draw do
  devise_for :users, path: 'auth', path_names: {
    sign_in: 'sign_in',
    sign_out: 'sign_out',
    registration: 'sign_up'
  }, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations'
  }
  
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"

  # TODO App API
  namespace :api do
    # API v1 routes with version constraint
    scope module: :v1, constraints: ApiVersionConstraint.new(version: 1) do
      # Version 1 routes accessible via:
      # - /api/v1/* (explicit versioning)
      # - Header: Accept: application/vnd.todo-api.v1+json
      # - Header: X-API-Version: v1
      resources :todos do
        collection do
          patch 'update_order'
          get 'search'
        end
        member do
          patch 'tags', to: 'todos#update_tags'
          delete 'files/:file_id', to: 'todos#destroy_file', as: 'destroy_file'
        end
        # Nested resources for polymorphic comments
        resources :comments, only: [:index, :create, :update, :destroy]
        # Read-only change history
        resources :histories, only: [:index], controller: 'todo_histories'
      end
      resources :categories
      resources :tags
    end
    
    # Explicit v1 namespace for URL-based versioning
    namespace :v1 do
      resources :todos do
        collection do
          patch 'update_order'
          get 'search'
        end
        member do
          patch 'tags', to: 'todos#update_tags'
          delete 'files/:file_id', to: 'todos#destroy_file', as: 'destroy_file'
        end
        resources :comments, only: [:index, :create, :update, :destroy]
        resources :histories, only: [:index], controller: 'todo_histories'
      end
      resources :categories
      resources :tags
    end
    
    # Default routes (backwards compatibility) - will be deprecated
    # These routes use v1 controllers but without explicit versioning
    scope module: :v1, constraints: ApiVersionConstraint.new(version: 1, default: true) do
      resources :todos do
        collection do
          patch 'update_order'
          get 'search'
        end
        member do
          patch 'tags', to: 'todos#update_tags'
          delete 'files/:file_id', to: 'todos#destroy_file', as: 'destroy_file'
        end
      end
      resources :categories
      resources :tags
    end
  end

end
