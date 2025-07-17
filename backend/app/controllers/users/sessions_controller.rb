class Users::SessionsController < Devise::SessionsController
  respond_to :json

  def destroy
    begin
      if current_user
        signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
        render json: {
          status: { code: 200, message: 'Logged out successfully.' }
        }
      else
        render json: {
          status: { code: 401, message: "Couldn't find an active session." }
        }, status: :unauthorized
      end
    rescue => e
      render json: {
        status: { code: 401, message: "Invalid token." }
      }, status: :unauthorized
    end
  end

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
end