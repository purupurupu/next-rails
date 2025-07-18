module Api
  class TodosController < ApplicationController
    before_action :set_todo, only: [:show, :update, :destroy]

    def index
      @todos = current_user.todos.ordered
      render json: @todos
    end

    def show
      render json: @todo
    end

    def create
      @todo = current_user.todos.build(todo_params)
      if @todo.save
        render json: @todo, status: :created
      else
        render json: @todo.errors, status: :unprocessable_entity
      end
    end

    def update
      if @todo.update(todo_params)
        render json: @todo
      else
        render json: @todo.errors, status: :unprocessable_entity
      end
    end

    def destroy
      @todo.destroy
      head :no_content
    end

    def update_order
      params[:todos].each do |todo_data|
        todo = current_user.todos.find(todo_data[:id])
        todo.update(position: todo_data[:position])
      end
      head :ok
    end

    private

    def set_todo
      @todo = current_user.todos.find(params[:id])
    end

    def todo_params
      params.require(:todo).permit(:title, :completed, :position, :due_date, :priority, :status, :description)
    end
  end
end
