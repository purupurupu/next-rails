# frozen_string_literal: true

require 'rails_helper'

RSpec.describe JsonWebTokenAuth, type: :controller do
  # テスト用のコントローラーを作成
  controller(ApplicationController) do
    def index
      render json: { message: 'success' }
    end
  end
  
  let(:user) { create(:user) }
  let(:token) { JwtService.encode({ user_id: user.id }) }
  
  describe 'included methods' do
    describe '#generate_token' do
      it 'generates a JWT token for a user' do
        generated_token = controller.send(:generate_token, user)
        expect(generated_token).to be_a(String)
        expect(JwtService.valid_token?(generated_token)).to be true
        expect(JwtService.user_id_from_token(generated_token)).to eq(user.id)
      end
    end
    
    describe '#valid_token?' do
      it 'returns true for valid token' do
        expect(controller.send(:valid_token?, token)).to be true
      end
      
      it 'returns false for invalid token' do
        expect(controller.send(:valid_token?, 'invalid.token')).to be false
      end
    end
    
    describe '#user_from_token' do
      it 'returns user for valid token' do
        result = controller.send(:user_from_token, token)
        expect(result).to eq(user)
      end
      
      it 'returns nil for invalid token' do
        result = controller.send(:user_from_token, 'invalid.token')
        expect(result).to be_nil
      end
    end
  end
  
  describe 'error handling' do
    context 'when JWT::DecodeError is raised' do
      it 'handles decode error gracefully' do
        request.headers['Authorization'] = 'Bearer invalid.token'
        get :index
        
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end
    
    context 'when JWT::ExpiredSignature is raised' do
      let(:expired_token) do
        # 期限切れトークンを直接作成
        expired_payload = { user_id: user.id, exp: 1.hour.ago.to_i }
        JWT.encode(expired_payload, Rails.application.secret_key_base, 'HS256')
      end
      
      it 'handles expired token error gracefully' do
        request.headers['Authorization'] = "Bearer #{expired_token}"
        get :index
        
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end
  end
  
  describe 'authentication flow' do
    context 'with valid token' do
      before do
        request.headers['Authorization'] = "Bearer #{token}"
      end
      
      it 'authenticates successfully' do
        get :index
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)['message']).to eq('success')
      end
      
      it 'sets current_user' do
        get :index
        expect(controller.send(:current_user)).to eq(user)
      end
    end
    
    context 'with invalid token' do
      before do
        request.headers['Authorization'] = 'Bearer invalid.token'
      end
      
      it 'returns unauthorized' do
        get :index
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end
    
    context 'without token' do
      it 'returns unauthorized' do
        get :index
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end
    
    context 'with malformed authorization header' do
      before do
        request.headers['Authorization'] = 'InvalidFormat token'
      end
      
      it 'returns unauthorized' do
        get :index
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end
    end
  end
end