# frozen_string_literal: true

module Services
  class TodoSearchService
    attr_reader :user, :params

    def initialize(user, params = {})
      @user = user
      @params = params.with_indifferent_access
    end

    def call
      scope = user.todos
      scope = apply_search(scope)
      scope = apply_filters(scope)
      scope = apply_sorting(scope)
      scope = apply_includes(scope)
      
      scope
    end

    private

    def apply_search(scope)
      scope
    end

    def apply_filters(scope)
      scope
    end

    def apply_sorting(scope)
      scope.ordered
    end

    def apply_includes(scope)
      scope.includes(:category, :tags, :comments, :user, files_attachments: :blob)
    end
  end
end