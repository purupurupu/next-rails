class AddCounterCachesToTodos < ActiveRecord::Migration[8.0]
  def change
    change_table :todos, bulk: true do |t|
      t.integer :comments_count, default: 0, null: false
      t.integer :todo_histories_count, default: 0, null: false
    end

    reversible do |dir|
      dir.up do
        # 既存データのカウンターを更新
        execute <<-SQL.squish
          UPDATE todos
          SET comments_count = (
            SELECT COUNT(*)
            FROM comments
            WHERE comments.commentable_type = 'Todo'
            AND comments.commentable_id = todos.id
            AND comments.deleted_at IS NULL
          )
        SQL

        execute <<-SQL.squish
          UPDATE todos
          SET todo_histories_count = (
            SELECT COUNT(*)
            FROM todo_histories
            WHERE todo_histories.todo_id = todos.id
          )
        SQL
      end
    end
  end
end
