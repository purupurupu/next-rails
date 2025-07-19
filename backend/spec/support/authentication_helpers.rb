# Authentication helpers for RSpec tests
# These helpers will be used for testing authenticated endpoints

module AuthenticationHelpers
  # Helper method to generate JWT token for testing
  def jwt_token_for(user)
    # Sign in the user and extract the JWT token from the response
    post '/auth/sign_in', params: { user: { email: user.email, password: user.password } }, as: :json, headers: { 'Host' => 'localhost:3001' }
    response.headers['Authorization']
  end

  # Helper method to set authorization headers
  def auth_headers(user)
    {
      'Authorization' => jwt_token_for(user),
      'Content-Type' => 'application/json',
      'Host' => 'localhost:3001'
    }
  end

  # Alias for consistency with new tests
  def auth_headers_for(user)
    auth_headers(user)
  end

  # Helper method to sign in a user and return the token
  def sign_in_user(user)
    post '/auth/sign_in', params: { user: { email: user.email, password: user.password } }, as: :json, headers: { 'Host' => 'localhost:3001' }
    response.headers['Authorization']
  end
end