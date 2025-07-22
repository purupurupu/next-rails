class Users::SessionsController < Devise::SessionsController
  include ApiResponseFormatter
  
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    success_response(
      message: 'Logged in successfully.',
      data: user_data(resource)
    )
  end

  def respond_to_on_destroy
    success_response(message: 'Logged out successfully.')
  end
end