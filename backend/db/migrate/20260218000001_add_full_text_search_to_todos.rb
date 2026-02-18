class AddFullTextSearchToTodos < ActiveRecord::Migration[8.0]
  def up
    # pg_trgm 拡張を有効化（ILIKE を GIN インデックスで高速化、言語非依存）
    execute "CREATE EXTENSION IF NOT EXISTS pg_trgm"

    # pg_trgm GIN インデックス（ILIKE の部分一致を高速化）
    execute <<-SQL.squish
      CREATE INDEX idx_todos_title_trgm
      ON todos USING gin(title gin_trgm_ops)
    SQL
    execute <<-SQL.squish
      CREATE INDEX idx_todos_description_trgm
      ON todos USING gin(description gin_trgm_ops)
    SQL
  end

  def down
    execute "DROP INDEX IF EXISTS idx_todos_title_trgm"
    execute "DROP INDEX IF EXISTS idx_todos_description_trgm"
  end
end
