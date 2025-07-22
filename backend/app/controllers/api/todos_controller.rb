module Api
  class TodosController < ApplicationController
    before_action :set_todo, only: [:show, :update, :destroy]

    def index
      @todos = current_user.todos.includes(:category).ordered
      render json: @todos, each_serializer: TodoSerializer
    end

    def show
      render json: @todo, serializer: TodoSerializer
    end

    def create
      @todo = current_user.todos.build(todo_params)
      if @todo.save
        render json: @todo, serializer: TodoSerializer, status: :created
      else
        render json: { errors: @todo.errors }, status: :unprocessable_entity
      end
    end

    def update
      if @todo.update(todo_params)
        render json: @todo, serializer: TodoSerializer
      else
        render json: { errors: @todo.errors }, status: :unprocessable_entity
      end
    end

    def destroy
      @todo.destroy
      head :no_content
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

    private

    def set_todo
      @todo = current_user.todos.find(params[:id])
    end

    def todo_params
      params.require(:todo).permit(:title, :completed, :position, :due_date, :priority, :status, :description, :category_id)
    end
  end
end
