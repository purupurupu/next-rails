"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { tagApiClient } from "../lib/api-client";
import type { Tag, CreateTagData, UpdateTagData } from "../types/tag";
import { API_ENDPOINTS } from "@/lib/constants";
import { defaultSWRConfig } from "@/lib/swr-config";
import { getErrorMessage, normalizeError } from "@/lib/error-utils";

// SWR fetcher
const fetcher = () => tagApiClient.getTags();

/**
 * タグ管理 hook
 *
 * @remarks
 * SWRによる自動リクエスト重複排除とキャッシュ管理を提供
 *
 * @param fetchOnMount - マウント時にデータを取得するかどうか（デフォルト: true）
 * @returns タグデータと CRUD 操作関数
 *
 * @example
 * ```typescript
 * const { tags, createTag, updateTag, deleteTag } = useTags();
 * await createTag({ name: "重要", color: "#ff0000" });
 * ```
 */
export function useTags(fetchOnMount = true) {
  const { data, error, isLoading, mutate } = useSWR<Tag[]>(
    fetchOnMount ? API_ENDPOINTS.TAGS : null,
    fetcher,
    defaultSWRConfig,
  );

  /**
   * 新しいタグを作成する
   */
  const createTag = useCallback(
    async (tagData: CreateTagData) => {
      try {
        const newTag = await tagApiClient.createTag(tagData);
        // 楽観的更新: キャッシュに新しいタグを追加
        await mutate((prev) => [...(prev || []), newTag], false);
        toast.success("タグを作成しました");
        return newTag;
      } catch (err) {
        const message = getErrorMessage(err, "タグの作成に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [mutate],
  );

  /**
   * タグを更新する
   */
  const updateTag = useCallback(
    async (id: number, tagData: UpdateTagData) => {
      try {
        const updatedTag = await tagApiClient.updateTag(id, tagData);
        // 楽観的更新: キャッシュ内のタグを更新
        await mutate(
          (prev) => prev?.map((tag) => (tag.id === id ? updatedTag : tag)) || [],
          false,
        );
        toast.success("タグを更新しました");
        return updatedTag;
      } catch (err) {
        const message = getErrorMessage(err, "タグの更新に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [mutate],
  );

  /**
   * タグを削除する
   */
  const deleteTag = useCallback(
    async (id: number) => {
      try {
        await tagApiClient.deleteTag(id);
        // 楽観的更新: キャッシュからタグを削除
        await mutate((prev) => prev?.filter((tag) => tag.id !== id) || [], false);
        toast.success("タグを削除しました");
      } catch (err) {
        const message = getErrorMessage(err, "タグの削除に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [mutate],
  );

  return {
    tags: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    fetchTags: mutate,
    createTag,
    updateTag,
    deleteTag,
  };
}
