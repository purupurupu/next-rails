"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import type { Comment, CreateCommentData, UpdateCommentData } from "../types/comment";
import { commentApiClient } from "../lib/api-client";
import { shortCacheSWRConfig } from "@/lib/swr-config";
import { getErrorMessage, normalizeError } from "@/lib/error-utils";

/**
 * SWRのキーを生成
 */
const getCommentsKey = (todoId: number | null) =>
  todoId ? `/api/v1/todos/${todoId}/comments` : null;

/**
 * コメント管理 hook
 *
 * @remarks
 * SWRによる自動リクエスト重複排除とキャッシュ管理を提供。
 * コメントは頻繁に更新される可能性があるため、短いキャッシュ設定を使用。
 *
 * @param todoId - コメントを取得するTodoのID（nullの場合はフェッチしない）
 * @returns コメントデータとCRUD操作関数
 *
 * @example
 * ```typescript
 * const { comments, createComment, deleteComment } = useComments(todoId);
 * await createComment({ content: "新しいコメント" });
 * ```
 */
export function useComments(todoId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Comment[]>(
    getCommentsKey(todoId),
    () => (todoId ? commentApiClient.getComments(todoId) : Promise.resolve([])),
    shortCacheSWRConfig,
  );

  /**
   * コメントを作成する
   */
  const createComment = useCallback(
    async (commentData: CreateCommentData) => {
      if (!todoId) return;

      try {
        const newComment = await commentApiClient.createComment(todoId, commentData);
        // 楽観的更新: キャッシュに新しいコメントを追加
        await mutate((prev) => [...(prev || []), newComment], false);
        toast.success("コメントを追加しました");
        return newComment;
      } catch (err) {
        const message = getErrorMessage(err, "コメントの作成に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [todoId, mutate],
  );

  /**
   * コメントを更新する
   */
  const updateComment = useCallback(
    async (commentId: number, commentData: UpdateCommentData) => {
      if (!todoId) return;

      try {
        const updatedComment = await commentApiClient.updateComment(todoId, commentId, commentData);
        // 楽観的更新: キャッシュ内のコメントを更新
        await mutate(
          (prev) => prev?.map((c) => (c.id === commentId ? updatedComment : c)) || [],
          false,
        );
        toast.success("コメントを更新しました");
        return updatedComment;
      } catch (err) {
        const message = getErrorMessage(err, "コメントの更新に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [todoId, mutate],
  );

  /**
   * コメントを削除する
   */
  const deleteComment = useCallback(
    async (commentId: number) => {
      if (!todoId) return;

      try {
        await commentApiClient.deleteComment(todoId, commentId);
        // 楽観的更新: キャッシュからコメントを削除
        await mutate((prev) => prev?.filter((c) => c.id !== commentId) || [], false);
        toast.success("コメントを削除しました");
      } catch (err) {
        const message = getErrorMessage(err, "コメントの削除に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [todoId, mutate],
  );

  return {
    comments: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    createComment,
    updateComment,
    deleteComment,
    fetchComments: mutate,
    refetch: mutate,
  };
}
