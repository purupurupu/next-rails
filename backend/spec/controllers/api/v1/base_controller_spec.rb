# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Api::V1::BaseController, type: :controller do
  controller(Api::V1::BaseController) do
    def index
      render_json_response(data: { message: 'test' }, status: :ok)
    end

    def show
      raise ActiveRecord::RecordNotFound
    end

    def create
      render_json_response(data: { id: 1 }, meta: { count: 1 }, status: :created)
    end

    def update
      render_json_response(status: :no_content)
    end

    def custom_error
      raise BusinessLogicError.new('Custom error')
    end
  end

  before do
    routes.draw do
      get 'index' => 'api/v1/base#index'
      get 'show' => 'api/v1/base#show'
      post 'create' => 'api/v1/base#create'
      put 'update' => 'api/v1/base#update'
      get 'custom_error' => 'api/v1/base#custom_error'
    end
  end

  let(:user) { create(:user) }

  describe 'API version header' do
    context 'when authenticated' do
      before { sign_in user }

      it 'sets X-API-Version header to v1' do
        get :index
        expect(response.headers['X-API-Version']).to eq('v1')
      end
    end
  end

  describe 'authentication' do
    it 'requires authentication for all actions' do
      get :index
      expect(response).to have_http_status(:unauthorized)
    end

    context 'when authenticated' do
      before { sign_in user }

      it 'allows access to actions' do
        get :index
        expect(response).to have_http_status(:ok)
      end
    end
  end

  describe '#render_json_response' do
    before { sign_in user }

    context 'with successful response' do
      it 'renders standard success format with data' do
        get :index
        json = JSON.parse(response.body)

        expect(response).to have_http_status(:ok)
        expect(json['status']).to include(
          'code' => 200,
          'message' => 'Request processed successfully'
        )
        expect(json['data']).to eq('message' => 'test')
        expect(json).not_to have_key('error')
      end

      it 'renders success format with data and meta' do
        post :create
        json = JSON.parse(response.body)

        expect(response).to have_http_status(:created)
        expect(json['status']).to include(
          'code' => 201,
          'message' => 'Resource created successfully'
        )
        expect(json['data']).to eq('id' => 1)
        expect(json['meta']).to eq('count' => 1)
      end

      it 'renders success format without data for no_content' do
        put :update
        json = JSON.parse(response.body)

        expect(response).to have_http_status(:no_content)
        expect(json['status']).to include(
          'code' => 204,
          'message' => 'Request processed successfully'
        )
        expect(json).not_to have_key('data')
        expect(json).not_to have_key('error')
      end
    end

    context 'with error response' do
      it 'renders standard error format' do
        get :custom_error
        json = JSON.parse(response.body)

        expect(response).to have_http_status(:unprocessable_entity)
        expect(json['error']).to include(
          'code' => 'BUSINESS_LOGIC_ERROR',
          'message' => 'Custom error'
        )
        expect(json['error']).to have_key('request_id')
        expect(json['error']).to have_key('timestamp')
        expect(json).not_to have_key('status')
        expect(json).not_to have_key('data')
      end
    end
  end

  describe 'error handling' do
    before { sign_in user }

    context 'when ActiveRecord::RecordNotFound is raised' do
      it 'handles the error with proper format' do
        get :show
        json = JSON.parse(response.body)

        expect(response).to have_http_status(:not_found)
        expect(json['error']).to include(
          'code' => 'RESOURCE_NOT_FOUND',
          'message' => 'The requested resource was not found.'
        )
        expect(json['error']).to have_key('request_id')
        expect(json['error']).to have_key('timestamp')
      end
    end
  end

  describe 'response headers' do
    before { sign_in user }

    it 'sets proper content type' do
      get :index
      expect(response.content_type).to match(%r{application/json})
    end

    it 'includes request ID in response' do
      get :index
      expect(response.headers).to have_key('X-Request-Id')
    end
  end

  describe 'inherited behavior' do
    it 'inherits from ApplicationController' do
      expect(Api::V1::BaseController).to be < ApplicationController
    end

    it 'uses appropriate modules' do
      # BaseController doesn't directly include ApiResponseFormatter
      # It inherits behavior from ApplicationController
      expect(Api::V1::BaseController).to be < ApplicationController
      expect(Api::V1::BaseController.private_instance_methods).to include(:render_json_response)
    end
  end
end
