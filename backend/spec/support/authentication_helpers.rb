# Authentication helpers for RSpec tests
# These helpers support both controller specs (using Devise helpers) and request specs (using JWT)

module AuthenticationHelpers
  # Cache for JWT tokens to avoid multiple login requests per user in a single test
  def jwt_tokens
    @jwt_tokens ||= {}
  end

  # Controller spec authentication using Devise test helpers
  def sign_in_user(user)
    if defined?(sign_in) # Devise controller test helpers available
      sign_in user
    else
      raise "sign_in method not available. Make sure Devise test helpers are included for controller specs."
    end
  end

  # Helper method to generate JWT token for testing (cached per user)  
  def jwt_token_for(user)
    return jwt_tokens[user.id] if jwt_tokens[user.id]

    # Ensure user has correct password for authentication
    user.password = 'password123' if user.encrypted_password.blank?
    user.password_confirmation = 'password123' if user.encrypted_password.blank?
    user.save! if user.changed?

    # Create a new request context for login
    post '/auth/sign_in', 
         params: { user: { email: user.email, password: 'password123' } }, 
         as: :json, 
         headers: { 'Content-Type' => 'application/json', 'Host' => 'localhost:3001' }
    
    if response.successful?
      token = response.headers['Authorization']
      if token
        jwt_tokens[user.id] = token
        return token
      else
        raise "No Authorization header returned for user #{user.email}. Response: #{response.body}"
      end
    else
      raise "Failed to authenticate user #{user.email}: #{response.status} - #{response.body}"
    end
  end

  # Helper method to set authorization headers for request specs
  def auth_headers_for(user)
    # Always get a fresh token to avoid caching issues
    jwt_tokens.delete(user.id) if jwt_tokens[user.id]
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

  # Debug helper to inspect authentication state
  def debug_auth_for(user)
    puts "=== Auth Debug for #{user.email} ==="
    puts "User ID: #{user.id}"
    puts "User valid: #{user.valid?}"
    puts "User errors: #{user.errors.full_messages}" unless user.valid?
    
    if jwt_tokens[user.id]
      puts "Cached token exists: #{jwt_tokens[user.id][0..20]}..." 
    else
      puts "No cached token"
    end
    puts "=================================="
  end
end