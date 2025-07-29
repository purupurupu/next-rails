module Api
  class TodosController < ApplicationController
    before_action :set_todo, only: [:show, :update, :destroy, :update_tags, :destroy_file]

    def index
      @todos = current_user.todos.includes(:category, :tags, :comments).ordered
      render json: @todos, each_serializer: TodoSerializer, current_user: current_user
    end

    def search
      @todos = TodoSearchService.new(current_user, search_params).call
      
      response_data = {
        todos: ActiveModelSerializers::SerializableResource.new(
          @todos,
          each_serializer: TodoSerializer,
          current_user: current_user,
          highlight_query: search_params[:q] || search_params[:query] || search_params[:search]
        ).as_json,
        meta: {
          total: @todos.total_count,
          current_page: @todos.current_page,
          total_pages: @todos.total_pages,
          per_page: @todos.limit_value,
          search_query: search_params[:q] || search_params[:query] || search_params[:search],
          filters_applied: active_filters
        }
      }

      # Add helpful feedback when no results found
      if @todos.total_count == 0
        response_data[:suggestions] = search_suggestions
      end

      render json: response_data
    end

    def show
      render json: @todo, serializer: TodoSerializer, current_user: current_user
    end

    def create
      @todo = current_user.todos.build(todo_params.except(:tag_ids, :files))
      
      # 学習ポイント：履歴記録のためにcurrent_userを設定
      @todo.current_user = current_user
      
      if params[:todo][:tag_ids].present?
        valid_tag_ids = current_user.tags.where(id: params[:todo][:tag_ids]).pluck(:id)
        @todo.tag_ids = valid_tag_ids
      end
      
      if @todo.save
        # Attach files after successful save
        if params[:todo][:files].present?
          @todo.files.attach(params[:todo][:files])
        end
        
        render json: @todo, serializer: TodoSerializer, current_user: current_user, status: :created
      else
        render json: { errors: @todo.errors }, status: :unprocessable_entity
      end
    end

    def update
      # 学習ポイント：履歴記録のためにcurrent_userを設定
      @todo.current_user = current_user
      
      if params[:todo][:tag_ids].present?
        valid_tag_ids = current_user.tags.where(id: params[:todo][:tag_ids]).pluck(:id)
        @todo.tag_ids = valid_tag_ids
      end
      
      # Handle file attachments separately to append rather than replace
      if params[:todo][:files].present?
        @todo.files.attach(params[:todo][:files])
      end
      
      if @todo.update(todo_params.except(:tag_ids, :files))
        render json: @todo, serializer: TodoSerializer, current_user: current_user
      else
        render json: { errors: @todo.errors }, status: :unprocessable_entity
      end
    end

    def destroy
      @todo.destroy
      head :no_content
    end

    def update_tags
      tag_ids = params[:tag_ids] || []
      
      # Validate that all tags belong to current user
      user_tag_ids = current_user.tags.where(id: tag_ids).pluck(:id)
      
      if user_tag_ids.sort == tag_ids.sort
        @todo.tag_ids = tag_ids
        render json: @todo, serializer: TodoSerializer, current_user: current_user
      else
        render json: { error: 'Invalid tag IDs' }, status: :unprocessable_entity
      end
    end

    def update_order
      todo_ids = params[:todos].map { |todo_data| todo_data[:id] }
      user_todos = current_user.todos.where(id: todo_ids).index_by(&:id)
      
      # Validate all todos belong to current user
      return head :not_found if user_todos.size != todo_ids.size
      
      # Prepare bulk update data
      updates = params[:todos].map do |todo_data|
        todo = user_todos[todo_data[:id]]
        { id: todo.id, position: todo_data[:position] }
      end
      
      # Perform bulk update using case statement
      ActiveRecord::Base.transaction do
        updates.each do |update_data|
          current_user.todos.where(id: update_data[:id]).update_all(position: update_data[:position])
        end
      end
      
      head :ok
    rescue => e
      Rails.logger.error "Failed to update todo order: #{e.message}"
      render json: { error: 'Failed to update todo order' }, status: :unprocessable_entity
    end

    def destroy_file
      file = @todo.files.find(params[:file_id])
      file.purge
      render json: @todo, serializer: TodoSerializer
    rescue ActiveRecord::RecordNotFound
      render json: { error: 'File not found' }, status: :not_found
    end

    private

    def set_todo
      @todo = current_user.todos.find(params[:id])
    end

    def todo_params
      params.require(:todo).permit(:title, :completed, :position, :due_date, :priority, :status, :description, :category_id, tag_ids: [], files: [])
    end

    def search_params
      params.permit(
        :q, :query, :search,
        :category_id,
        :due_date_from, :due_date_to,
        :sort_by, :sort_order,
        :tag_mode,
        :page, :per_page,
        status: [],
        priority: [],
        tag_ids: []
      )
    end

    def active_filters
      filters = {}
      filters[:search] = search_params[:q] || search_params[:query] || search_params[:search] if search_params[:q] || search_params[:query] || search_params[:search]
      filters[:category_id] = search_params[:category_id] if search_params[:category_id].present?
      filters[:status] = Array(search_params[:status]) if search_params[:status].present?
      filters[:priority] = Array(search_params[:priority]) if search_params[:priority].present?
      filters[:tag_ids] = search_params[:tag_ids] if search_params[:tag_ids].present?
      filters[:date_range] = {
        from: search_params[:due_date_from],
        to: search_params[:due_date_to]
      } if search_params[:due_date_from].present? || search_params[:due_date_to].present?
      filters
    end

    def search_suggestions
      suggestions = []
      
      # Check if search query is present
      if search_params[:q].present? || search_params[:query].present? || search_params[:search].present?
        suggestions << {
          type: 'spelling',
          message: '検索キーワードのスペルを確認してください。'
        }
        suggestions << {
          type: 'broader_search',
          message: 'より一般的なキーワードで検索してみてください。'
        }
      end

      # Check if too many filters are applied
      if active_filters.size > 3
        suggestions << {
          type: 'reduce_filters',
          message: 'フィルター条件を減らしてみてください。',
          current_filters: active_filters.keys
        }
      end

      # Specific filter suggestions
      if search_params[:status].present? && Array(search_params[:status]).size > 1
        suggestions << {
          type: 'status_filter',
          message: 'ステータスフィルターを1つに絞ってみてください。'
        }
      end

      if search_params[:tag_ids].present? && search_params[:tag_mode] == 'all'
        suggestions << {
          type: 'tag_mode',
          message: 'タグの検索モードを「いずれか」（ANY）に変更してみてください。'
        }
      end

      if search_params[:due_date_from].present? && search_params[:due_date_to].present?
        suggestions << {
          type: 'date_range',
          message: '日付範囲を広げてみてください。'
        }
      end

      # General suggestions
      suggestions << {
        type: 'clear_filters',
        message: 'すべてのフィルターをクリアして、もう一度お試しください。'
      }

      suggestions
    end
  end
end
