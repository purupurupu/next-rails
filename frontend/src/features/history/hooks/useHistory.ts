"use client";

import useSWR from "swr";
import type { TodoHistory } from "../types/history";
import { historyApiClient } from "../lib/api-client";
import { defaultSWRConfig } from "@/lib/swr-config";

/**
 * SWRのキーを生成
 */
const getHistoryKey = (todoId: number | null) =>
  todoId ? `/api/v1/todos/${todoId}/histories` : null;

/**
 * 履歴管理 hook
 *
 * @remarks
 * SWRによる自動リクエスト重複排除とキャッシュ管理を提供。
 * 履歴は読み取り専用のため、フェッチと再検証のみをサポート。
 *
 * @param todoId - 履歴を取得するTodoのID（nullの場合はフェッチしない）
 * @returns 履歴データと再フェッチ関数
 *
 * @example
 * ```typescript
 * const { histories, isLoading, refetch } = useHistory(todoId);
 * ```
 */
export function useHistory(todoId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<TodoHistory[]>(
    getHistoryKey(todoId),
    () => (todoId ? historyApiClient.getHistories(todoId) : Promise.resolve([])),
    defaultSWRConfig,
  );

  return {
    histories: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    fetchHistories: mutate,
    refetch: mutate,
  };
}
