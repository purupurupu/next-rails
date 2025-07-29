# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'API Versioning', type: :request do
  let(:user) { create(:user) }
  let(:auth_headers) { Devise::JWT::TestHelpers.auth_headers({}, user) }
  
  describe 'Version routing' do
    context 'with URL-based versioning' do
      it 'routes to v1 controllers via /api/v1 path' do
        get '/api/v1/todos', headers: auth_headers
        
        expect(response).to have_http_status(:ok)
        expect(response.headers['X-API-Version']).to eq('v1')
      end
    end
    
    context 'with header-based versioning' do
      it 'routes to v1 controllers via Accept header' do
        headers = auth_headers.merge(
          'Accept' => 'application/vnd.todo-api.v1+json'
        )
        
        get '/api/todos', headers: headers
        
        expect(response).to have_http_status(:ok)
        expect(response.headers['X-API-Version']).to eq('v1')
      end
      
      it 'routes to v1 controllers via X-API-Version header' do
        headers = auth_headers.merge(
          'X-API-Version' => 'v1'
        )
        
        get '/api/todos', headers: headers
        
        expect(response).to have_http_status(:ok)
        expect(response.headers['X-API-Version']).to eq('v1')
      end
    end
    
    context 'with non-versioned URLs (backward compatibility)' do
      it 'routes to v1 controllers by default and adds deprecation warning' do
        get '/api/todos', headers: auth_headers
        
        expect(response).to have_http_status(:ok)
        expect(response.headers['X-API-Version']).to eq('v1')
        expect(response.headers['X-API-Deprecation-Warning']).to include('deprecated')
        expect(response.headers['X-API-Deprecation-Date']).to be_present
      end
    end
  end
  
  describe 'Consistent response format' do
    it 'returns success response in standardized format' do
      get '/api/v1/todos', headers: auth_headers
      
      json = JSON.parse(response.body)
      
      expect(json).to have_key('status')
      expect(json['status']).to have_key('code')
      expect(json['status']).to have_key('message')
      expect(json['status']['code']).to eq(200)
      expect(json['status']['message']).to eq('Todos retrieved successfully')
      expect(json).to have_key('data')
    end
    
    it 'returns error response in standardized format' do
      get '/api/v1/todos/999999', headers: auth_headers
      
      json = JSON.parse(response.body)
      
      expect(response).to have_http_status(:not_found)
      expect(json).to have_key('error')
      expect(json['error']).to have_key('code')
      expect(json['error']).to have_key('message')
      expect(json['error']).to have_key('request_id')
      expect(json['error']).to have_key('timestamp')
      expect(json['error']['code']).to eq('RESOURCE_NOT_FOUND')
    end
  end
end