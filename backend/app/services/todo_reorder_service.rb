class TodoReorderService
  attr_reader :user, :todos_data

  def initialize(user:, todos_data:)
    @user = user
    @todos_data = todos_data
  end

  def call
    todo_ids = todos_data.pluck(:id)
    user_todos = user.todos.where(id: todo_ids).index_by(&:id)

    missing_ids = todo_ids - user_todos.keys
    if missing_ids.any?
      return ServiceResult.failure(error: 'Some todos not found', details: { missing_todos: missing_ids })
    end

    perform_reorder(user_todos)
    ServiceResult.success
  rescue StandardError => e
    ServiceResult.failure(error: 'Failed to update todo order', details: { error: e.message })
  end

  private

  def perform_reorder(user_todos)
    updates = todos_data.map do |todo_data|
      { id: user_todos[todo_data[:id]].id, position: todo_data[:position] }
    end

    ActiveRecord::Base.transaction do
      updates.each do |update_data|
        user.todos.where(id: update_data[:id]).update_all(position: update_data[:position])
      end
    end
  end
end
