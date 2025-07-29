# frozen_string_literal: true

module Services
  class TodoSearchService
    attr_reader :user, :params

    def initialize(user, params = {})
      @user = user
      @params = params.with_indifferent_access
    end

    def call
      # Check cache first
      cache_key = generate_cache_key
      cached_result = Rails.cache.read(cache_key)
      
      return cached_result if cached_result.present? && !params[:skip_cache]

      # Build query
      scope = user.todos
      scope = apply_search(scope)
      scope = apply_filters(scope)
      scope = apply_sorting(scope)
      scope = apply_includes(scope)
      scope = apply_pagination(scope)
      
      # Cache the result for 5 minutes
      Rails.cache.write(cache_key, scope, expires_in: 5.minutes) if scope.count < 1000
      
      scope
    end

    private

    def generate_cache_key
      # Generate a unique cache key based on user and search parameters
      key_parts = ["todo_search", user.id]
      
      # Add search query
      key_parts << "q:#{search_query}" if search_query.present?
      
      # Add filters
      key_parts << "cat:#{params[:category_id]}" if params[:category_id].present?
      key_parts << "status:#{Array(params[:status]).sort.join(',')}" if params[:status].present?
      key_parts << "priority:#{Array(params[:priority]).sort.join(',')}" if params[:priority].present?
      key_parts << "tags:#{Array(params[:tag_ids]).sort.join(',')}" if params[:tag_ids].present?
      key_parts << "tag_mode:#{params[:tag_mode]}" if params[:tag_mode].present?
      key_parts << "from:#{params[:due_date_from]}" if params[:due_date_from].present?
      key_parts << "to:#{params[:due_date_to]}" if params[:due_date_to].present?
      
      # Add sorting
      key_parts << "sort:#{params[:sort_by]}_#{params[:sort_order]}"
      
      # Add pagination
      key_parts << "page:#{params[:page] || 1}"
      key_parts << "per:#{params[:per_page] || 20}"
      
      key_parts.join("/")
    end

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
      sort_by = params[:sort_by] || 'position'
      sort_order = params[:sort_order]&.downcase == 'desc' ? 'DESC' : 'ASC'

      case sort_by
      when 'created_at'
        scope.order(created_at: sort_order)
      when 'updated_at'
        scope.order(updated_at: sort_order)
      when 'due_date'
        scope.order(Arel.sql("due_date IS NULL, due_date #{sort_order}"))
      when 'title'
        scope.order(Arel.sql("LOWER(title) #{sort_order}"))
      when 'priority'
        # Sort by priority value (high=2, medium=1, low=0)
        order_direction = sort_order == 'DESC' ? 'DESC' : 'ASC'
        scope.order(priority: order_direction)
      when 'status'
        # Sort by status value (completed=2, in_progress=1, pending=0)
        scope.order(status: sort_order)
      else
        # Default to position-based ordering
        scope.ordered
      end
    end

    def apply_includes(scope)
      scope.includes(:category, :tags, :comments, :user, files_attachments: :blob)
    end

    def apply_pagination(scope)
      page = (params[:page] || 1).to_i
      per_page = (params[:per_page] || 20).to_i
      
      # Limit per_page to prevent abuse
      per_page = 100 if per_page > 100
      per_page = 1 if per_page < 1
      
      scope.page(page).per(per_page)
    end
  end
end