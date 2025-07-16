# Authentication helpers for RSpec tests
# These helpers will be used for testing authenticated endpoints

module AuthenticationHelpers
  # Helper method to generate JWT token for testing
  def jwt_token_for(user)
    # This will be implemented when we create the JWT service
    # For now, just a placeholder
    "jwt_token_placeholder"
  end

  # Helper method to set authorization headers
  def auth_headers(user)
    {
      'Authorization' => "Bearer #{jwt_token_for(user)}",
      'Content-Type' => 'application/json'
    }
  end
end