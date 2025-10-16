# frozen_string_literal: true

module Mcp
  module Tools
    class SearchTodos < MCP::Tool
      description 'Search and filter user\'s todos by title, status, priority, and category'

      input_schema(
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query for todo title (partial match)'
          },
          user_id: {
            type: 'integer',
            description: 'User ID to scope the search'
          },
          status: {
            type: 'string',
            enum: %w[pending in_progress completed],
            description: 'Filter by todo status'
          },
          priority: {
            type: 'string',
            enum: %w[low medium high],
            description: 'Filter by priority level'
          },
          category_id: {
            type: 'integer',
            description: 'Filter by category ID'
          },
          limit: {
            type: 'integer',
            description: 'Maximum number of results (default: 10, max: 50)'
          }
        },
        required: %w[query user_id]
      )

      def self.call(query:, user_id:, status: nil, priority: nil, category_id: nil, limit: 10, **_options)
        # リミットの検証
        limit = [[limit.to_i, 1].max, 50].min

        # ユーザーの存在確認
        user = User.find_by(id: user_id)
        return error_response('User not found') unless user

        # 基本クエリ: ユーザースコープ + タイトル検索
        todos = user.todos
                    .where('title ILIKE ?', "%#{sanitize_query(query)}%")
                    .includes(:category, :tags)

        # フィルター適用
        todos = todos.where(status:) if status.present?
        todos = todos.where(priority:) if priority.present?
        todos = todos.where(category_id:) if category_id.present?

        # 結果取得
        results = todos.limit(limit).ordered.map do |todo|
          format_todo(todo)
        end

        # レスポンス作成
        MCP::Tool::Response.new([{
          type: 'text',
          text: JSON.pretty_generate({
            count: results.size,
            total_found: todos.count,
            todos: results
          })
        }])
      rescue ActiveRecord::RecordNotFound => e
        error_response("Record not found: #{e.message}")
      rescue StandardError => e
        Rails.logger.error("MCP SearchTodos Error: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        error_response("Search failed: #{e.message}")
      end

      # プライベートメソッド

      def self.sanitize_query(query)
        # SQLインジェクション対策
        query.to_s.gsub(/[_%\\]/) { |char| "\\#{char}" }
      end

      def self.format_todo(todo)
        {
          id: todo.id,
          title: todo.title,
          description: todo.description,
          status: todo.status,
          priority: todo.priority,
          due_date: todo.due_date&.iso8601,
          category: todo.category&.name,
          category_color: todo.category&.color,
          tags: todo.tags.map { |tag| { name: tag.name, color: tag.color } },
          completed: todo.completed,
          created_at: todo.created_at.iso8601,
          updated_at: todo.updated_at.iso8601
        }
      end

      def self.error_response(message)
        MCP::Tool::Response.new([{
          type: 'text',
          text: JSON.generate({ error: message })
        }])
      end

      private_class_method :sanitize_query, :format_todo, :error_response
    end
  end
end
