module Api
  class TodosController < ApplicationController
    before_action :set_todo, only: [:show, :update, :destroy, :update_tags, :destroy_file]

    def index
      @todos = current_user.todos.includes(:category, :tags).ordered
      render json: @todos, each_serializer: TodoSerializer
    end

    def show
      render json: @todo, serializer: TodoSerializer
    end

    def create
      @todo = current_user.todos.build(todo_params.except(:tag_ids, :files))
      
      if params[:todo][:tag_ids].present?
        valid_tag_ids = current_user.tags.where(id: params[:todo][:tag_ids]).pluck(:id)
        @todo.tag_ids = valid_tag_ids
      end
      
      if @todo.save
        # Attach files after successful save
        if params[:todo][:files].present?
          @todo.files.attach(params[:todo][:files])
        end
        
        render json: @todo, serializer: TodoSerializer, status: :created
      else
        render json: { errors: @todo.errors }, status: :unprocessable_entity
      end
    end

    def update
      if params[:todo][:tag_ids].present?
        valid_tag_ids = current_user.tags.where(id: params[:todo][:tag_ids]).pluck(:id)
        @todo.tag_ids = valid_tag_ids
      end
      
      # Handle file attachments separately to append rather than replace
      if params[:todo][:files].present?
        @todo.files.attach(params[:todo][:files])
      end
      
      if @todo.update(todo_params.except(:tag_ids, :files))
        render json: @todo, serializer: TodoSerializer
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
        render json: @todo, serializer: TodoSerializer
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
  end
end
