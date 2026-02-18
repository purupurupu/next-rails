# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Rack::Attack Rate Limiting', type: :request do
  include AuthenticationHelpers

  before do
    # テスト用にRack::Attackを有効化してリセット
    Rack::Attack.enabled = true
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
    Rack::Attack.reset!
  end

  after do
    Rack::Attack.reset!
    Rack::Attack.enabled = false
  end

  describe 'authenticated user rate limiting (100 req/min per user)' do
    let(:user) { create(:user) }

    it 'allows requests within the limit' do
      headers = auth_headers_for(user)
      Rack::Attack.reset!

      get '/api/v1/categories', headers: headers
      expect(response).to have_http_status(:ok)
    end

    it 'throttles by user ID extracted from JWT, not by IP' do
      headers = auth_headers_for(user)
      Rack::Attack.reset!

      # ユーザーIDベースのスロットリングなのでBFFパターンでも正しく動作
      100.times do
        get '/api/v1/categories', headers: headers
      end

      # 101回目は429
      get '/api/v1/categories', headers: headers
      expect(response).to have_http_status(:too_many_requests)
    end

    it 'returns proper rate limit headers when throttled' do
      headers = auth_headers_for(user)
      Rack::Attack.reset!

      101.times do
        get '/api/v1/categories', headers: headers
      end

      expect(response.headers['X-RateLimit-Limit']).to eq('100')
      expect(response.headers['X-RateLimit-Remaining']).to eq('0')
      expect(response.headers['Retry-After']).to be_present
    end

    it 'returns JSON error body when throttled' do
      headers = auth_headers_for(user)
      Rack::Attack.reset!

      101.times do
        get '/api/v1/categories', headers: headers
      end

      body = response.parsed_body
      expect(body['error']['code']).to eq('RATE_LIMIT_EXCEEDED')
      expect(body['error']['message']).to eq('Rate limit exceeded. Please try again later.')
      expect(body['error']['details']['limit']).to eq(100)
      expect(body['error']['details']['remaining']).to eq(0)
    end

    it 'tracks different users independently' do
      other_user = create(:user)
      headers = auth_headers_for(user)
      other_headers = auth_headers_for(other_user)
      Rack::Attack.reset!

      # ユーザー1が99回リクエスト
      99.times do
        get '/api/v1/categories', headers: headers
      end

      # ユーザー2はまだ制限に達していない
      get '/api/v1/categories', headers: other_headers
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'unauthenticated user rate limiting (20 req/min per IP)' do
    it 'allows requests within the limit' do
      get '/api/v1/categories'
      expect(response.status).not_to eq(429)
    end

    it 'returns 429 when unauthenticated rate limit is exceeded' do
      20.times do
        get '/api/v1/categories'
      end

      get '/api/v1/categories'
      expect(response).to have_http_status(:too_many_requests)
    end

    it 'returns proper JSON error for unauthenticated throttling' do
      21.times do
        get '/api/v1/categories'
      end

      body = response.parsed_body
      expect(body['error']['code']).to eq('RATE_LIMIT_EXCEEDED')
      expect(body['error']['details']['limit']).to eq(20)
    end
  end
end
