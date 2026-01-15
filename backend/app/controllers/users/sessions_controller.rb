class Users::SessionsController < Devise::SessionsController
  include ApiResponseFormatter

  respond_to :json

  # Override Devise's authentication failure handling
  def auth_options
    super.merge(recall: 'users/sessions#auth_failure')
  end

  def auth_failure
    error = ::AuthenticationError.new('Invalid email or password')
    render_error_response(error: error, status: :unauthorized)
  end

  # GET /auth/me - 現在の認証済みユーザー情報を返す
  def show
    if current_user
      success_response(message: 'Authenticated.', data: user_data(current_user))
    else
      error = ::AuthenticationError.new('Not authenticated')
      render_error_response(error: error, status: :unauthorized)
    end
  end

  private

  def respond_with(resource, _opts = {})
    success_response(
      message: 'Logged in successfully.',
      data: user_data(resource)
    )
  end

  def respond_to_on_destroy
    if current_user
      success_response(message: 'Logged out successfully.')
    else
      error = ::AuthenticationError.new('No active session found')
      render_error_response(error: error, status: :unauthorized)
    end
  end
end
