# frozen_string_literal: true

module Api
  module V1
    # Base controller for API v1 endpoints
    # Provides common functionality for all v1 API controllers
    class BaseController < ApplicationController
      # API version information
      API_VERSION = 'v1'
      API_VERSION_HEADER = 'X-API-Version'
      
      before_action :set_api_version_header
      before_action :check_api_deprecation
      
      private
      
      # Set API version in response headers
      def set_api_version_header
        response.headers[API_VERSION_HEADER] = API_VERSION
      end
      
      # Check if client is using deprecated API version via non-versioned URLs
      def check_api_deprecation
        if request.path.match?(%r{^/api/(?!v\d+/)})
          response.headers['X-API-Deprecation-Warning'] = 
            'Non-versioned API endpoints are deprecated. Please use /api/v1/* endpoints.'
          response.headers['X-API-Deprecation-Date'] = '2025-06-01'
        end
      end
      
      # Override render to ensure consistent API responses
      def render_json_response(data: nil, message: nil, status: :ok, serializer: nil, each_serializer: nil, **options)
        response_body = build_response_body(data, message, status, serializer, each_serializer, options)
        render json: response_body, status: status
      end
      
      def render_error_response(error:, status: :unprocessable_entity, details: nil)
        error_body = {
          error: {
            code: error_code_for(error),
            message: error.is_a?(String) ? error : error.message,
            details: details || extract_error_details(error),
            request_id: request.request_id,
            timestamp: Time.current.iso8601
          }
        }
        
        render json: error_body, status: status
      end
      
      private
      
      def build_response_body(data, message, status, serializer, each_serializer, options)
        response_body = {
          status: {
            code: Rack::Utils.status_code(status),
            message: message || default_message_for(status)
          }
        }
        
        if data.present?
          serialized_data = if serializer || each_serializer
            serialize_data(data, serializer, each_serializer, options)
          else
            data
          end
          
          response_body[:data] = serialized_data
        end
        
        response_body[:meta] = options[:meta] if options[:meta].present?
        response_body
      end
      
      def serialize_data(data, serializer, each_serializer, options)
        serializer_options = options.merge(current_user: current_user)
        
        if each_serializer
          ActiveModelSerializers::SerializableResource.new(
            data,
            each_serializer: each_serializer,
            **serializer_options
          ).as_json
        elsif serializer
          ActiveModelSerializers::SerializableResource.new(
            data,
            serializer: serializer,
            **serializer_options
          ).as_json
        else
          data
        end
      end
      
      def error_code_for(error)
        case error
        when ActiveRecord::RecordNotFound
          'RESOURCE_NOT_FOUND'
        when ActiveRecord::RecordInvalid
          'VALIDATION_FAILED'
        when ActionController::ParameterMissing
          'PARAMETER_MISSING'
        when ArgumentError
          'INVALID_ARGUMENT'
        else
          'UNKNOWN_ERROR'
        end
      end
      
      def extract_error_details(error)
        case error
        when ActiveRecord::RecordInvalid
          error.record.errors.details
        when ActionController::ParameterMissing
          { missing_parameter: error.param }
        else
          {}
        end
      end
      
      def default_message_for(status)
        case status
        when :ok
          'Request processed successfully'
        when :created
          'Resource created successfully'
        when :no_content
          'Request processed successfully'
        else
          'Request processed'
        end
      end
    end
  end
end