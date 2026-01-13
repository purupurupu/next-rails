# frozen_string_literal: true

module Api
  module V1
    class TodosController < BaseController
      include TodoSearchFilters
      include TodoSearchSuggestions

      before_action :set_todo, only: %i[show update destroy update_tags destroy_file]

      def index
        @todos = current_user.todos.includes(:category, :tags, :comments).ordered
        render_json_response(
          data: @todos,
          each_serializer: TodoSerializer,
          message: 'Todos retrieved successfully'
        )
      end

      def search
        @todos = TodoSearchService.new(current_user, search_params).call

        meta_data = {
          total: @todos.total_count,
          current_page: @todos.current_page,
          total_pages: @todos.total_pages,
          per_page: @todos.limit_value,
          search_query: search_params[:q] || search_params[:query] || search_params[:search],
          filters_applied: active_filters
        }

        # Add helpful feedback when no results found
        meta_data[:suggestions] = search_suggestions if @todos.total_count.zero?

        render_json_response(
          data: @todos,
          each_serializer: TodoSerializer,
          highlight_query: search_params[:q] || search_params[:query] || search_params[:search],
          meta: meta_data,
          message: 'Search completed successfully'
        )
      end

      def show
        render_json_response(
          data: @todo,
          serializer: TodoSerializer,
          message: 'Todo retrieved successfully'
        )
      end

      def create
        @todo = current_user.todos.build(todo_params.except(:tag_ids, :files))

        assign_tags_if_present
        return render_validation_error(@todo) unless @todo.save

        attach_files_if_present
        render_json_response(
          data: @todo,
          serializer: TodoSerializer,
          status: :created,
          message: 'Todo created successfully'
        )
      end

      def update
        assign_tags_if_present
        attach_files_if_present
        return render_validation_error(@todo) unless @todo.update(todo_params.except(:tag_ids, :files))

        render_json_response(
          data: @todo,
          serializer: TodoSerializer,
          message: 'Todo updated successfully'
        )
      end

      def destroy
        @todo.destroy
        render_json_response(
          message: 'Todo deleted successfully',
          status: :no_content
        )
      end

      def update_tags
        result = TodoTagService.new(
          todo: @todo,
          user: current_user,
          tag_ids: params[:tag_ids]
        ).call

        if result.success?
          render_json_response(
            data: result.data,
            serializer: TodoSerializer,
            message: 'Tags updated successfully'
          )
        else
          render_error_response(
            error: result.error,
            status: :unprocessable_content,
            details: result.details
          )
        end
      end

      def update_order
        result = TodoReorderService.new(
          user: current_user,
          todos_data: params[:todos]
        ).call

        if result.success?
          render_json_response(message: 'Todo order updated successfully')
        else
          status = result.details&.key?(:missing_todos) ? :not_found : :unprocessable_content
          render_error_response(
            error: result.error,
            status: status,
            details: result.details
          )
        end
      end

      def destroy_file
        result = TodoFileService.new(todo: @todo).destroy(params[:file_id])

        if result.success?
          render_json_response(
            data: result.data,
            serializer: TodoSerializer,
            message: 'File deleted successfully'
          )
        else
          render_error_response(error: result.error, status: :not_found)
        end
      end

      private

      def set_todo
        @todo = current_user.todos.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render_error_response(
          error: 'Todo not found',
          status: :not_found
        )
      end

      def todo_params
        params.require(:todo).permit(:title, :completed, :position, :due_date, :priority, :status, :description,
                                     :category_id, tag_ids: [], files: [])
      end

      def assign_tags_if_present
        return if params[:todo][:tag_ids].blank?

        TodoTagService.new(
          todo: @todo,
          user: current_user,
          tag_ids: params[:todo][:tag_ids]
        ).assign_valid_tags
      end

      def attach_files_if_present
        return if params[:todo][:files].blank?

        TodoFileService.new(todo: @todo).attach(params[:todo][:files])
      end

      def render_validation_error(record)
        render_error_response(
          error: ::ValidationError.new(errors: record.errors),
          status: :unprocessable_content
        )
      end

      def search_params
        # Handle both single values and arrays for status and priority
        permitted = params.permit(
          :q, :query, :search,
          :category_id,
          :due_date_from, :due_date_to,
          :sort_by, :sort_order,
          :tag_mode,
          :page, :per_page,
          :status, :priority, # Allow single values
          status: [],
          priority: [],
          tag_ids: []
        )

        # Convert single values to arrays if needed
        permitted[:status] = [permitted[:status]] if permitted[:status].present? && !permitted[:status].is_a?(Array)

        if permitted[:priority].present? && !permitted[:priority].is_a?(Array)
          permitted[:priority] = [permitted[:priority]]
        end

        permitted
      end
    end
  end
end
