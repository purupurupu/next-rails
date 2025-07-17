class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      # JWTトークンを手動で生成してレスポンスボディに含める
      token = Warden::JWTAuth::UserEncoder.new.call(resource, :user, nil).first
      
      render json: {
        status: { code: 200, message: 'Signed up successfully.' },
        data: {
          id: resource.id,
          email: resource.email,
          name: resource.name,
          created_at: resource.created_at
        },
        token: token
      }
    else
      render json: {
        status: { code: 422, message: "User couldn't be created successfully. #{resource.errors.full_messages.to_sentence}" }
      }, status: :unprocessable_entity
    end
  end

end