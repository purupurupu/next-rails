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

  # TODO App
  namespace :api do
    resources :todos do
      collection do
        patch 'update_order'
      end
      member do
        patch 'tags', to: 'todos#update_tags'
      end
    end
    resources :categories
    resources :tags
  end

end
