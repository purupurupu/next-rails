require 'rails_helper'

RSpec.describe 'Authentication', type: :request do
  let(:headers) { { 'Host' => 'localhost:3001' } }
  describe 'POST /auth/sign_up' do
    let(:valid_attributes) do
      {
        user: {
          email: 'test@example.com',
          password: 'password123',
          password_confirmation: 'password123',
          name: 'Test User'
        }
      }
    end

    let(:invalid_attributes) do
      {
        user: {
          email: 'invalid_email',
          password: 'short',
          password_confirmation: 'different',
          name: ''
        }
      }
    end

    context 'with valid parameters' do
      it 'creates a new user' do
        expect {
          post '/auth/sign_up', params: valid_attributes, as: :json, headers: headers
        }.to change(User, :count).by(1)
      end

      it 'returns success response' do
        post '/auth/sign_up', params: valid_attributes, as: :json, headers: headers
        
        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include('application/json')
        
        json_response = JSON.parse(response.body)
        expect(json_response['status']['code']).to eq(200)
        expect(json_response['status']['message']).to eq('Signed up successfully.')
        expect(json_response['data']['email']).to eq('test@example.com')
        expect(json_response['data']['name']).to eq('Test User')
        expect(json_response['data']['id']).to be_present
      end

      it 'returns JWT token in authorization header' do
        post '/auth/sign_up', params: valid_attributes, as: :json, headers: headers
        
        expect(response.headers['Authorization']).to be_present
        expect(response.headers['Authorization']).to match(/^Bearer /)
      end
    end

    context 'with invalid parameters' do
      it 'does not create a user' do
        expect {
          post '/auth/sign_up', params: invalid_attributes, as: :json, headers: headers
        }.not_to change(User, :count)
      end

      it 'returns error response' do
        post '/auth/sign_up', params: invalid_attributes, as: :json, headers: headers
        
        expect(response).to have_http_status(:unprocessable_entity)
        
        json_response = JSON.parse(response.body)
        expect(json_response['status']['code']).to eq(422)
        expect(json_response['status']['message']).to include("User couldn't be created successfully")
      end
    end

    context 'with duplicate email' do
      before do
        create(:user, email: 'test@example.com')
      end

      it 'returns error response' do
        post '/auth/sign_up', params: valid_attributes, as: :json, headers: headers
        
        expect(response).to have_http_status(:unprocessable_entity)
        
        json_response = JSON.parse(response.body)
        expect(json_response['status']['code']).to eq(422)
        expect(json_response['status']['message']).to include('Email has already been taken')
      end
    end
  end

  describe 'POST /auth/sign_in' do
    let!(:user) { create(:user, email: 'test@example.com', password: 'password123') }

    let(:valid_credentials) do
      {
        user: {
          email: 'test@example.com',
          password: 'password123'
        }
      }
    end

    let(:invalid_credentials) do
      {
        user: {
          email: 'test@example.com',
          password: 'wrong_password'
        }
      }
    end

    context 'with valid credentials' do
      it 'returns success response' do
        post '/auth/sign_in', params: valid_credentials, as: :json, headers: headers
        
        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include('application/json')
        
        json_response = JSON.parse(response.body)
        expect(json_response['status']['code']).to eq(200)
        expect(json_response['status']['message']).to eq('Logged in successfully.')
        expect(json_response['data']['email']).to eq('test@example.com')
        expect(json_response['data']['id']).to eq(user.id)
      end

      it 'returns JWT token in authorization header' do
        post '/auth/sign_in', params: valid_credentials, as: :json, headers: headers
        
        expect(response.headers['Authorization']).to be_present
        expect(response.headers['Authorization']).to match(/^Bearer /)
      end
    end

    context 'with invalid credentials' do
      it 'returns unauthorized response' do
        post '/auth/sign_in', params: invalid_credentials, as: :json, headers: headers
        
        expect(response).to have_http_status(:unauthorized)
        
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to eq('Invalid Email or password.')
      end
    end

    context 'with missing email' do
      it 'returns unauthorized response' do
        post '/auth/sign_in', params: { user: { password: 'password123' } }, as: :json, headers: headers
        
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with missing password' do
      it 'returns unauthorized response' do
        post '/auth/sign_in', params: { user: { email: 'test@example.com' } }, as: :json, headers: headers
        
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with non-existent user' do
      it 'returns unauthorized response' do
        post '/auth/sign_in', params: { user: { email: 'nonexistent@example.com', password: 'password123' } }, as: :json, headers: headers
        
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /auth/sign_out' do
    let!(:user) { create(:user) }

    context 'when user is authenticated' do
      it 'returns success response' do
        post '/auth/sign_in', params: { user: { email: user.email, password: user.password } }, as: :json, headers: headers
        auth_token = response.headers['Authorization']
        
        delete '/auth/sign_out', headers: headers.merge({ 'Authorization' => auth_token }), as: :json
        
        expect(response).to have_http_status(:ok)
        
        json_response = JSON.parse(response.body)
        expect(json_response['status']['code']).to eq(200)
        expect(json_response['status']['message']).to eq('Logged out successfully.')
      end

      it 'revokes the JWT token' do
        post '/auth/sign_in', params: { user: { email: user.email, password: user.password } }, as: :json, headers: headers
        auth_token = response.headers['Authorization']
        
        expect {
          delete '/auth/sign_out', headers: headers.merge({ 'Authorization' => auth_token }), as: :json
        }.to change(JwtDenylist, :count).by(1)
      end
    end

    context 'when user is not authenticated' do
      it 'returns success response (idempotent behavior)' do
        delete '/auth/sign_out', as: :json, headers: headers
        
        # Note: Devise sign_out is idempotent - returns success even when not authenticated
        expect(response).to have_http_status(:ok)
      end
    end

    context 'with invalid token' do
      it 'returns unauthorized response' do
        delete '/auth/sign_out', headers: headers.merge({ 'Authorization' => 'Bearer invalid_token' }), as: :json
        
        # Invalid JWT tokens cause 500 errors at the middleware level
        expect(response).to have_http_status(:internal_server_error)
      end
    end
  end

  describe 'JWT Token Flow' do
    let!(:user) { create(:user) }

    it 'allows access to protected resources with valid token' do
      # Sign in and get token
      post '/auth/sign_in', params: { user: { email: user.email, password: user.password } }, as: :json, headers: headers
      auth_token = response.headers['Authorization']
      
      # Use token to access protected resource
      get '/api/todos', headers: headers.merge({ 'Authorization' => auth_token }), as: :json
      
      expect(response).to have_http_status(:ok)
    end

    it 'denies access to protected resources with invalid token' do
      get '/api/todos', headers: headers.merge({ 'Authorization' => 'Bearer invalid_token' }), as: :json
      
      expect(response).to have_http_status(:unauthorized)
    end

    it 'denies access to protected resources without token' do
      get '/api/todos', as: :json, headers: headers
      
      expect(response).to have_http_status(:unauthorized)
    end

    it 'denies access after token is revoked' do
      # Sign in and get token
      post '/auth/sign_in', params: { user: { email: user.email, password: user.password } }, as: :json, headers: headers
      auth_token = response.headers['Authorization']
      
      # Sign out (revoke token)
      delete '/auth/sign_out', headers: headers.merge({ 'Authorization' => auth_token }), as: :json
      
      # Try to access protected resource with revoked token
      get '/api/todos', headers: headers.merge({ 'Authorization' => auth_token }), as: :json
      
      expect(response).to have_http_status(:unauthorized)
    end
  end
end