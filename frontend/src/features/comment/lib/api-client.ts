import { HttpClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/constants";
import type { Comment, CreateCommentData, UpdateCommentData } from "../types/comment";

/**
 * コメント機能のAPIクライアント
 *
 * @remarks
 * Todo に紐づくコメントの CRUD 操作を提供する
 */
export class CommentApiClient extends HttpClient {
  /**
   * 指定したTodoのコメント一覧を取得する
   *
   * @param todoId - コメントを取得するTodoのID
   * @returns コメントの配列
   */
  async getComments(todoId: number): Promise<Comment[]> {
    return this.getList<Comment>(API_ENDPOINTS.TODO_COMMENTS(todoId));
  }

  /**
   * 新しいコメントを作成する
   *
   * @param todoId - コメントを追加するTodoのID
   * @param data - コメントの作成データ
   * @returns 作成されたコメント
   */
  async createComment(todoId: number, data: CreateCommentData): Promise<Comment> {
    return this.post<Comment>(API_ENDPOINTS.TODO_COMMENTS(todoId), { comment: data });
  }

  /**
   * コメントを更新する
   *
   * @param todoId - コメントが属するTodoのID
   * @param commentId - 更新するコメントのID
   * @param data - コメントの更新データ
   * @returns 更新されたコメント
   */
  async updateComment(
    todoId: number,
    commentId: number,
    data: UpdateCommentData,
  ): Promise<Comment> {
    return this.patch<Comment>(API_ENDPOINTS.TODO_COMMENT_BY_ID(todoId, commentId), {
      comment: data,
    });
  }

  /**
   * コメントを削除する（ソフトデリート）
   *
   * @param todoId - コメントが属するTodoのID
   * @param commentId - 削除するコメントのID
   */
  async deleteComment(todoId: number, commentId: number): Promise<void> {
    await this.delete(API_ENDPOINTS.TODO_COMMENT_BY_ID(todoId, commentId));
  }
}

export const commentApiClient = new CommentApiClient();
