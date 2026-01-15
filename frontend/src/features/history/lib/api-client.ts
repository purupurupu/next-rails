import { HttpClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/constants";
import type { TodoHistory } from "../types/history";

/**
 * Todo履歴機能のAPIクライアント
 *
 * @remarks
 * Todoの変更履歴を取得する機能を提供する
 */
export class HistoryApiClient extends HttpClient {
  /**
   * 指定したTodoの変更履歴を取得する
   *
   * @param todoId - 履歴を取得するTodoのID
   * @returns 変更履歴の配列（新しい順）
   */
  async getHistories(todoId: number): Promise<TodoHistory[]> {
    return this.get<TodoHistory[]>(API_ENDPOINTS.TODO_HISTORIES(todoId));
  }
}

export const historyApiClient = new HistoryApiClient();
