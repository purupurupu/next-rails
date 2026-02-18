# Rate limiting configuration using Rack::Attack
# Authenticated users: 100 requests/minute (per user)
# Unauthenticated users: 20 requests/minute (per IP)

# テスト環境ではデフォルトで無効化（テスト内で明示的に有効化可能）
Rack::Attack.enabled = !Rails.env.test?

Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new if Rails.env.test?
Rack::Attack.cache.store = ActiveSupport::Cache::RedisCacheStore.new(
  url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
) unless Rails.env.test?

# JWTからユーザーIDを抽出（BFFパターン対応）
extract_user_id = lambda do |req|
  token = req.env['HTTP_AUTHORIZATION']&.gsub(/^Bearer /, '')
  return nil if token.blank?

  secret = ENV['SECRET_KEY_BASE'] || Rails.application.credentials.secret_key_base
  payload = JWT.decode(token, secret, true, algorithm: 'HS256').first
  payload['sub']
rescue JWT::DecodeError, JWT::ExpiredSignature
  nil
end

# Authenticated users: 100 requests per minute (user ID単位)
Rack::Attack.throttle('authenticated/user', limit: 100, period: 1.minute) do |req|
  user_id = extract_user_id.call(req)
  "user:#{user_id}" if user_id.present?
end

# Unauthenticated users: 20 requests per minute (IP単位)
Rack::Attack.throttle('unauthenticated/ip', limit: 20, period: 1.minute) do |req|
  token = req.env['HTTP_AUTHORIZATION']&.gsub(/^Bearer /, '')
  req.ip if token.blank?
end

# Return 429 Too Many Requests with JSON body
Rack::Attack.throttled_responder = lambda do |req|
  match_data = req.env['rack.attack.match_data']
  now = match_data[:epoch_time]

  headers = {
    'Content-Type' => 'application/json',
    'Retry-After' => (match_data[:period] - (now % match_data[:period])).to_s,
    'X-RateLimit-Limit' => match_data[:limit].to_s,
    'X-RateLimit-Remaining' => '0',
    'X-RateLimit-Reset' => (now + (match_data[:period] - (now % match_data[:period]))).to_s
  }

  body = {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded. Please try again later.',
      details: {
        limit: match_data[:limit],
        remaining: 0,
        retry_after: match_data[:period] - (now % match_data[:period])
      }
    }
  }

  [429, headers, [body.to_json]]
end
