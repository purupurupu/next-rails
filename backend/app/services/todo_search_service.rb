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
      return scope if search_query.blank?

      search_term = "%#{search_query.downcase}%"
      
      scope.where(
        "LOWER(todos.title) LIKE :query OR LOWER(todos.description) LIKE :query",
        query: search_term
      )
    end

    def search_query
      params[:q] || params[:query] || params[:search]
    end

    def apply_filters(scope)
      scope = filter_by_category(scope)
      scope = filter_by_status(scope)
      scope = filter_by_priority(scope)
      scope = filter_by_tags(scope)
      scope = filter_by_date_range(scope)
      scope
    end

    def filter_by_category(scope)
      return scope unless params[:category_id].present?

      category_ids = Array(params[:category_id]).map(&:to_i).reject(&:zero?)
      
      if category_ids.include?(-1) || params[:category_id] == 'null'
        # Include todos without category
        if category_ids.size > 1
          scope.where(category_id: category_ids.reject { |id| id == -1 }).or(scope.where(category_id: nil))
        else
          scope.where(category_id: nil)
        end
      else
        scope.where(category_id: category_ids)
      end
    end

    def filter_by_status(scope)
      return scope unless params[:status].present?

      statuses = Array(params[:status]).map(&:to_s).select { |s| Todo.statuses.key?(s) }
      return scope if statuses.empty?

      scope.where(status: statuses)
    end

    def filter_by_priority(scope)
      return scope unless params[:priority].present?

      priorities = Array(params[:priority]).map(&:to_s).select { |p| Todo.priorities.key?(p) }
      return scope if priorities.empty?

      scope.where(priority: priorities)
    end

    def filter_by_tags(scope)
      return scope unless params[:tag_ids].present?

      tag_ids = Array(params[:tag_ids]).map(&:to_i).reject(&:zero?)
      return scope if tag_ids.empty?

      # Validate tag IDs belong to current user
      valid_tag_ids = user.tags.where(id: tag_ids).pluck(:id)
      return scope if valid_tag_ids.empty?

      # Filter by tag IDs with AND/OR logic
      tag_mode = params[:tag_mode] || 'any' # 'any' for OR, 'all' for AND
      
      if tag_mode == 'all'
        # Find todos that have ALL specified tags
        todo_ids = user.todos.joins(:todo_tags)
                            .where(todo_tags: { tag_id: valid_tag_ids })
                            .group('todos.id')
                            .having('COUNT(DISTINCT todo_tags.tag_id) = ?', valid_tag_ids.size)
                            .pluck(:id)
        scope.where(id: todo_ids)
      else
        # Find todos that have ANY of the specified tags (OR)
        scope.joins(:todo_tags).where(todo_tags: { tag_id: valid_tag_ids }).distinct
      end
    end

    def filter_by_date_range(scope)
      scope = filter_by_due_date_from(scope)
      scope = filter_by_due_date_to(scope)
      scope
    end

    def filter_by_due_date_from(scope)
      return scope unless params[:due_date_from].present?

      begin
        date_from = Date.parse(params[:due_date_from])
        scope.where('due_date >= ?', date_from)
      rescue ArgumentError
        # Invalid date format, skip filter
        scope
      end
    end

    def filter_by_due_date_to(scope)
      return scope unless params[:due_date_to].present?

      begin
        date_to = Date.parse(params[:due_date_to])
        scope.where('due_date <= ?', date_to)
      rescue ArgumentError
        # Invalid date format, skip filter
        scope
      end
    end

    def apply_sorting(scope)
      scope.ordered
    end

    def apply_includes(scope)
      scope.includes(:category, :tags, :comments, :user, files_attachments: :blob)
    end
  end
end