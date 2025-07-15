module Api

class TodosController < ApplicationController
    def index
      @todos = Todo.all
      render json: @todos
    end

    def show
      @todo = Todo.find(params[:id])
      render json: @todo
    end

    def create
      @todo = Todo.new(todo_params)
      if @todo.save
        render json: @todo, status: :created
      else
        render json: @todo.errors, status: :unprocessable_entity
      end
    end

    def update
      @todo = Todo.find(params[:id])
      if @todo.update(todo_params)
        render json: @todo
      else
        render json: @todo.errors, status: :unprocessable_entity
      end
    end

    def destroy
      @todo = Todo.find(params[:id])
      @todo.destroy
      head :no_content
    end

    def update_order
      params[:todos].each do |todo_data|
        todo = Todo.find(todo_data[:id])
        todo.update(position: todo_data[:position])
      end
      head :ok
    end

    private

    def todo_params
      params.require(:todo).permit(:title, :completed, :position, :due_date)
    end
end
end
