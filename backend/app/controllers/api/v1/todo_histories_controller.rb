# frozen_string_literal: true

module Api
  module V1
    # 学習ポイント：Todoの変更履歴を表示するコントローラー
    class TodoHistoriesController < BaseController
      before_action :set_todo

      # GET /api/v1/todos/:todo_id/histories
      def index
        # 学習ポイント：履歴を新しい順に取得し、関連データを含める
        histories = @todo.todo_histories
                         .includes(:user)
                         .recent(50) # 最新50件まで

        render_json_response(
          data: histories,
          each_serializer: TodoHistorySerializer,
          message: '履歴を取得しました'
        )
      end

      private

      def set_todo
        # 学習ポイント：ユーザースコープでのセキュリティ確保
        @todo = current_user.todos.find(params[:todo_id])
      end
    end
  end
end
