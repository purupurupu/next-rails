import type { APIRequestContext } from "@playwright/test";

const API_BASE = "/api/v1";

/**
 * API経由でTodoを作成する（テストデータのセットアップ用）。
 * BFF経由で呼び出すため、storageStateの認証Cookieが必要。
 */
export async function createTodo(
  request: APIRequestContext,
  data: { title: string; description?: string },
) {
  const response = await request.post(`${API_BASE}/todos`, { data });
  if (!response.ok()) {
    throw new Error(`Todo作成失敗: ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

/**
 * API経由でTodoを削除する（テストデータのクリーンアップ用）。
 */
export async function deleteTodo(
  request: APIRequestContext,
  id: number,
) {
  const response = await request.delete(`${API_BASE}/todos/${id}`);
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`Todo削除失敗: ${response.status()} ${await response.text()}`);
  }
}
