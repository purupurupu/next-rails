# Authentication helpers for RSpec tests
# These helpers will be used for testing authenticated endpoints

module AuthenticationHelpers
  # Cache for JWT tokens to avoid multiple login requests per user in a single test
  def jwt_tokens
    @jwt_tokens ||= {}
  end

  # Helper method to generate JWT token for testing (cached per user)
  def jwt_token_for(user)
    return jwt_tokens[user.id] if jwt_tokens[user.id]

    # Create a new request context for login
    post '/auth/sign_in', 
         params: { user: { email: user.email, password: user.password } }, 
         as: :json, 
         headers: { 'Host' => 'localhost:3001' }
    
    if response.successful?
      token = response.headers['Authorization']
      jwt_tokens[user.id] = token if token
      token
    else
      raise "Failed to authenticate user #{user.email}: #{response.status} - #{response.body}"
    end
  end

  # Helper method to set authorization headers
  def auth_headers_for(user)
    token = jwt_token_for(user)
    {
      'Authorization' => token,
      'Content-Type' => 'application/json',
      'Host' => 'localhost:3001'
    }
  end

  # Clear JWT token cache (useful for before blocks)
  def clear_auth_cache
    @jwt_tokens = {}
  end
end