class Users::RegistrationsController < Devise::RegistrationsController
  include ApiResponseFormatter
  
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      success_response(
        message: 'Signed up successfully.',
        data: user_data(resource)
      )
    else
      error_response(
        message: "User couldn't be created successfully. #{resource.errors.full_messages.to_sentence}"
      )
    end
  end
end