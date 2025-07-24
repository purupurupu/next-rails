# frozen_string_literal: true

module Api
  module V1
    # 学習ポイント：ネストされたリソースコントローラー
    # Todoの下にネストされたコメント管理のコントローラー
    class CommentsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_todo
      before_action :set_comment, only: [:update, :destroy]
      
      # GET /api/v1/todos/:todo_id/comments
      def index
        # 学習ポイント：N+1クエリを避けるためのincludesの使用
        @comments = @todo.comments
                         .includes(:user)
                         .chronological
        
        render json: @comments, each_serializer: CommentSerializer, current_user: current_user
      end
      
      # POST /api/v1/todos/:todo_id/comments
      def create
        @comment = @todo.comments.build(comment_params)
        @comment.user = current_user
        
        if @comment.save
          render json: @comment, serializer: CommentSerializer, current_user: current_user, status: :created
        else
          render json: { errors: @comment.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # PATCH/PUT /api/v1/todos/:todo_id/comments/:id
      def update
        # 学習ポイント：編集権限のチェック
        unless @comment.owned_by?(current_user)
          return render json: { error: 'コメントの編集権限がありません' }, status: :forbidden
        end
        
        # 学習ポイント：編集可能時間のチェック
        unless @comment.editable?
          return render json: { error: 'コメントの編集可能時間が過ぎています' }, status: :unprocessable_entity
        end
        
        if @comment.update(comment_params)
          render json: @comment, serializer: CommentSerializer, current_user: current_user
        else
          render json: { errors: @comment.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      # DELETE /api/v1/todos/:todo_id/comments/:id
      def destroy
        # 学習ポイント：削除権限のチェック（所有者のみ削除可能）
        unless @comment.owned_by?(current_user)
          return render json: { error: 'コメントの削除権限がありません' }, status: :forbidden
        end
        
        # 学習ポイント：ソフトデリートの実装
        # 履歴保持のため、実際にはレコードを削除しない
        @comment.soft_delete!
        head :no_content
      end
      
      private
      
      def set_todo
        # 学習ポイント：ユーザースコープによるセキュリティ
        # 他のユーザーのTodoにアクセスできないようにする
        @todo = current_user.todos.find(params[:todo_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Todo not found' }, status: :not_found
      end
      
      def set_comment
        @comment = @todo.comments.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Comment not found' }, status: :not_found
      end
      
      def comment_params
        params.require(:comment).permit(:content)
      end
    end
  end
end
