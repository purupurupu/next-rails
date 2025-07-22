class ApplicationController < ActionController::API
  before_action :authenticate_user!, unless: :devise_registration_or_session_controller?
  before_action :configure_permitted_parameters, if: :devise_controller?
  
  rescue_from ActionController::ParameterMissing do |exception|
    Rails.logger.error "Parameter missing: #{exception.message}"
    Rails.logger.error "Params received: #{params.inspect}"
    render json: { error: "Parameter missing: #{exception.param}" }, status: :bad_request
  end
  
  
  
  private
  
  def devise_registration_or_session_controller?
    devise_controller? && (
      controller_name == 'registrations' || 
      (controller_name == 'sessions' && action_name.in?(['create', 'new', 'destroy']))
    )
  end
  
  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name])
  end
  
end