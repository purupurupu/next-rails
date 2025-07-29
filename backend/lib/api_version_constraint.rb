# frozen_string_literal: true

# API Version Constraint for routing
# Supports versioning via:
# 1. URL path (e.g., /api/v1/todos)
# 2. Accept header (e.g., application/vnd.todo-api.v1+json)
# 3. Custom header (e.g., X-API-Version: v1)
class ApiVersionConstraint
  attr_reader :version, :default
  
  def initialize(options)
    @version = options[:version]
    @default = options[:default] || false
  end
  
  def matches?(request)
    # Check custom header first
    if request.headers['X-API-Version'].present?
      return request.headers['X-API-Version'] == "v#{version}"
    end
    
    # Check Accept header for vendor-specific versioning
    if request.headers['Accept'].present?
      accept_header = request.headers['Accept']
      return accept_header.include?("application/vnd.todo-api.v#{version}+json")
    end
    
    # Default version if specified
    @default
  end
  
  # Helper method to extract version from various sources
  def self.extract_version(request)
    # Priority order:
    # 1. URL path version
    if request.path =~ %r{/api/v(\d+)/}
      return $1.to_i
    end
    
    # 2. Custom header
    if request.headers['X-API-Version'].present?
      version_match = request.headers['X-API-Version'].match(/v(\d+)/)
      return version_match[1].to_i if version_match
    end
    
    # 3. Accept header
    if request.headers['Accept'].present?
      accept_match = request.headers['Accept'].match(/application\/vnd\.todo-api\.v(\d+)\+json/)
      return accept_match[1].to_i if accept_match
    end
    
    # Default to version 1
    1
  end
end