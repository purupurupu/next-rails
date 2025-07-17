class Users::SessionsController < Devise::SessionsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    render json: {
      status: { code: 200, message: 'Logged in successfully.' },
      data: {
        id: resource.id,
        email: resource.email,
        name: resource.name,
        created_at: resource.created_at
      }
    }
  end

  def respond_to_on_destroy
    if current_user
      render json: {
        status: { code: 200, message: 'Logged out successfully.' }
      }
    else
      render json: {
        status: { code: 401, message: "Couldn't find an active session." }
      }
    end
  end
end