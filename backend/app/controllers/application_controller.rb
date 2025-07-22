class ApplicationController < ActionController::API
  before_action :authenticate_user!, unless: :devise_registration_or_session_controller?
  before_action :configure_permitted_parameters, if: :devise_controller?
  
  # Unified error handling (order matters - more specific exceptions first)
  rescue_from ActionController::ParameterMissing, with: :handle_parameter_missing
  rescue_from ActiveRecord::RecordNotFound, with: :handle_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :handle_unprocessable_entity
  rescue_from ArgumentError, with: :handle_bad_request
  rescue_from RuntimeError, with: :handle_internal_server_error
  
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

  # Error handlers
  def handle_not_found(exception)
    log_error(exception, :warn)
    render json: { 
      error: 'Resource not found',
      message: exception.message 
    }, status: :not_found
  end

  def handle_unprocessable_entity(exception)
    log_error(exception, :warn)
    render json: { 
      error: 'Validation failed',
      message: exception.message,
      errors: exception.record&.errors
    }, status: :unprocessable_entity
  end

  def handle_parameter_missing(exception)
    log_error(exception, :warn)
    render json: { 
      error: 'Parameter missing',
      message: "Parameter missing: #{exception.param}" 
    }, status: :bad_request
  end

  def handle_bad_request(exception)
    log_error(exception, :warn)
    render json: { 
      error: 'Bad request',
      message: exception.message
    }, status: :bad_request
  end

  def handle_internal_server_error(exception)
    log_error(exception, :error)
    render json: { 
      error: 'Internal server error',
      message: Rails.env.production? ? 'Something went wrong' : exception.message
    }, status: :internal_server_error
  end

  def log_error(exception, level = :error)
    Rails.logger.send(level, "#{exception.class.name}: #{exception.message}")
    Rails.logger.send(level, "Controller: #{controller_name}##{action_name}")
    Rails.logger.send(level, "Params: #{params.inspect}") unless Rails.env.production?
    Rails.logger.send(level, exception.backtrace.join("\n")) if level == :error && !Rails.env.production?
  end
end