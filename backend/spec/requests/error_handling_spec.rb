# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Error Handling', type: :request do
  let(:user) { create(:user) }
  let(:auth_headers) { Devise::JWT::TestHelpers.auth_headers({}, user) }
  
  describe 'Request ID tracking' do
    it 'includes request ID in response headers' do
      get '/api/v1/todos', headers: auth_headers
      
      expect(response.headers['X-Request-Id']).to be_present
    end
    
    it 'includes request ID in error responses' do
      get '/api/v1/todos/999999', headers: auth_headers
      
      json = JSON.parse(response.body)
      expect(json['error']['request_id']).to be_present
      expect(json['error']['request_id']).to eq(response.headers['X-Request-Id'])
    end
  end
  
  describe 'Standardized error responses' do
    context 'with not found errors' do
      it 'returns proper error format for missing resources' do
        get '/api/v1/todos/999999', headers: auth_headers
        
        expect(response).to have_http_status(:not_found)
        
        json = JSON.parse(response.body)
        expect(json['error']['code']).to eq('RESOURCE_NOT_FOUND')
        expect(json['error']['message']).to include('not found')
        expect(json['error']['details']).to be_a(Hash)
        expect(json['error']['timestamp']).to match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      end
    end
    
    context 'with validation errors' do
      it 'returns proper error format for validation failures' do
        post '/api/v1/todos', 
             params: { todo: { title: '' } }, 
             headers: auth_headers.merge('Content-Type' => 'application/json')
        
        expect(response).to have_http_status(:unprocessable_entity)
        
        json = JSON.parse(response.body)
        expect(json['error']['code']).to eq('VALIDATION_FAILED')
        expect(json['error']['details']).to have_key('validation_errors')
      end
    end
    
    context 'with authentication errors' do
      it 'returns proper error format for missing authentication' do
        get '/api/v1/todos'
        
        expect(response).to have_http_status(:unauthorized)
      end
      
      it 'returns proper error format for invalid credentials' do
        post '/auth/sign_in', 
             params: { user: { email: 'wrong@example.com', password: 'wrong' } },
             headers: { 'Content-Type' => 'application/json' }
        
        expect(response).to have_http_status(:unauthorized)
        
        json = JSON.parse(response.body)
        expect(json['error']['code']).to eq('AUTHENTICATION_FAILED')
        expect(json['error']['message']).to include('Invalid email or password')
      end
    end
    
    context 'with parameter errors' do
      it 'returns proper error format for missing parameters' do
        post '/api/v1/todos', 
             params: {}, 
             headers: auth_headers.merge('Content-Type' => 'application/json')
        
        expect(response).to have_http_status(:bad_request)
        
        json = JSON.parse(response.body)
        expect(json['error']['code']).to eq('PARAMETER_MISSING')
        expect(json['error']['message']).to include('Required parameter missing')
        expect(json['error']['details']['missing_parameter']).to eq('todo')
      end
    end
  end
  
  describe 'Custom error classes' do
    it 'handles business logic errors properly' do
      # Create a todo with maximum tags (assuming there's a limit)
      todo = create(:todo, user: user)
      
      # Try to add invalid tags
      patch "/api/v1/todos/#{todo.id}/tags",
            params: { tag_ids: [999999] },
            headers: auth_headers.merge('Content-Type' => 'application/json')
      
      expect(response).to have_http_status(:unprocessable_entity)
      
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('ERROR')
      expect(json['error']['message']).to eq('Invalid tag IDs')
      expect(json['error']['details']['invalid_tags']).to eq([999999])
    end
  end
end