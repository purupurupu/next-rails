# frozen_string_literal: true

require 'rails_helper'

RSpec.describe JwtService, type: :service do
  let(:user) { create(:user) }
  let(:payload) { { user_id: user.id } }
  let(:token) { described_class.encode(payload) }
  
  describe '.encode' do
    it 'encodes payload into JWT token' do
      expect(token).to be_a(String)
      expect(token.split('.').size).to eq(3)
    end
    
    it 'includes expiration time in payload' do
      decoded_payload = described_class.decode(token)
      expect(decoded_payload['exp']).to be_present
      expect(decoded_payload['exp']).to be > Time.current.to_i
    end
    
    it 'includes user_id in payload' do
      decoded_payload = described_class.decode(token)
      expect(decoded_payload['user_id']).to eq(user.id)
    end
  end
  
  describe '.decode' do
    context 'with valid token' do
      it 'decodes JWT token' do
        decoded_payload = described_class.decode(token)
        expect(decoded_payload['user_id']).to eq(user.id)
      end
      
      it 'returns hash with string keys' do
        decoded_payload = described_class.decode(token)
        expect(decoded_payload).to be_a(Hash)
        expect(decoded_payload.keys).to all(be_a(String))
      end
    end
    
    context 'with invalid token' do
      it 'raises JWT::DecodeError for malformed token' do
        expect { described_class.decode('invalid.token') }.to raise_error(JWT::DecodeError)
      end
      
      it 'raises JWT::DecodeError for token with wrong signature' do
        wrong_token = JWT.encode(payload, 'wrong_secret', 'HS256')
        expect { described_class.decode(wrong_token) }.to raise_error(JWT::DecodeError)
      end
    end
    
    context 'with expired token' do
      let(:expired_token) do
        # 期限切れトークンを直接作成
        expired_payload = { user_id: user.id, exp: 1.hour.ago.to_i }
        JWT.encode(expired_payload, Rails.application.secret_key_base, 'HS256')
      end
      
      it 'raises JWT::ExpiredSignature for expired token' do
        expect { described_class.decode(expired_token) }.to raise_error(JWT::ExpiredSignature)
      end
    end
  end
  
  describe '.valid_token?' do
    context 'with valid token' do
      it 'returns true' do
        expect(described_class.valid_token?(token)).to be true
      end
    end
    
    context 'with invalid token' do
      it 'returns false for nil token' do
        expect(described_class.valid_token?(nil)).to be false
      end
      
      it 'returns false for empty string' do
        expect(described_class.valid_token?('')).to be false
      end
      
      it 'returns false for malformed token' do
        expect(described_class.valid_token?('invalid.token')).to be false
      end
      
      it 'returns false for token with wrong signature' do
        wrong_token = JWT.encode(payload, 'wrong_secret', 'HS256')
        expect(described_class.valid_token?(wrong_token)).to be false
      end
    end
    
    context 'with expired token' do
      let(:expired_token) do
        # 期限切れトークンを直接作成
        expired_payload = { user_id: user.id, exp: 1.hour.ago.to_i }
        JWT.encode(expired_payload, Rails.application.secret_key_base, 'HS256')
      end
      
      it 'returns false for expired token' do
        expect(described_class.valid_token?(expired_token)).to be false
      end
    end
  end
  
  describe '.expired_token?' do
    context 'with valid token' do
      it 'returns false for non-expired token' do
        expect(described_class.expired_token?(token)).to be false
      end
    end
    
    context 'with expired token' do
      let(:expired_token) do
        # 期限切れトークンを直接作成
        expired_payload = { user_id: user.id, exp: 1.hour.ago.to_i }
        JWT.encode(expired_payload, Rails.application.secret_key_base, 'HS256')
      end
      
      it 'returns true for expired token' do
        expect(described_class.expired_token?(expired_token)).to be true
      end
    end
    
    context 'with invalid token' do
      it 'returns true for nil token' do
        expect(described_class.expired_token?(nil)).to be true
      end
      
      it 'returns true for empty string' do
        expect(described_class.expired_token?('')).to be true
      end
      
      it 'returns true for malformed token' do
        expect(described_class.expired_token?('invalid.token')).to be true
      end
    end
  end
  
  describe '.user_id_from_token' do
    context 'with valid token' do
      it 'returns user_id from token' do
        expect(described_class.user_id_from_token(token)).to eq(user.id)
      end
    end
    
    context 'with invalid token' do
      it 'returns nil for invalid token' do
        expect(described_class.user_id_from_token('invalid.token')).to be_nil
      end
      
      it 'returns nil for nil token' do
        expect(described_class.user_id_from_token(nil)).to be_nil
      end
    end
    
    context 'with expired token' do
      let(:expired_token) do
        # 期限切れトークンを直接作成
        expired_payload = { user_id: user.id, exp: 1.hour.ago.to_i }
        JWT.encode(expired_payload, Rails.application.secret_key_base, 'HS256')
      end
      
      it 'returns nil for expired token' do
        expect(described_class.user_id_from_token(expired_token)).to be_nil
      end
    end
  end
  
  describe 'token lifecycle' do
    it 'can encode and decode a token successfully' do
      original_payload = { user_id: user.id, additional_data: 'test' }
      token = described_class.encode(original_payload)
      decoded_payload = described_class.decode(token)
      
      expect(decoded_payload['user_id']).to eq(user.id)
      expect(decoded_payload['additional_data']).to eq('test')
    end
    
    it 'maintains token validity throughout its lifecycle' do
      token = described_class.encode(payload)
      
      expect(described_class.valid_token?(token)).to be true
      expect(described_class.expired_token?(token)).to be false
      expect(described_class.user_id_from_token(token)).to eq(user.id)
    end
  end
end