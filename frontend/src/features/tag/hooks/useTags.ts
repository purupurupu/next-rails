"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { tagApiClient } from "../lib/api-client";
import type { Tag, CreateTagData, UpdateTagData } from "../types/tag";
import { toast } from "sonner";

// SWR fetcher
const fetcher = () => tagApiClient.getTags();

/**
 * タグ管理 hook (client-swr-dedup ルール適用)
 *
 * SWRによる自動リクエスト重複排除とキャッシュ管理
 */
export function useTags(fetchOnMount = true) {
  const { data, error, isLoading, mutate } = useSWR<Tag[]>(
    fetchOnMount ? "/api/v1/tags" : null,
    fetcher,
    {
      dedupingInterval: 60000, // 1分間の重複排除
      revalidateOnFocus: false,
    }
  );

  const createTag = useCallback(async (tagData: CreateTagData) => {
    try {
      const newTag = await tagApiClient.createTag(tagData);
      // 楽観的更新: キャッシュに新しいタグを追加
      await mutate((prev) => [...(prev || []), newTag], false);
      toast.success("タグを作成しました");
      return newTag;
    } catch (err) {
      const message = err instanceof Error ? err.message : "タグの作成に失敗しました";
      toast.error(message);
      throw err;
    }
  }, [mutate]);

  const updateTag = useCallback(async (id: number, tagData: UpdateTagData) => {
    try {
      const updatedTag = await tagApiClient.updateTag(id, tagData);
      // 楽観的更新: キャッシュ内のタグを更新
      await mutate(
        (prev) => prev?.map((tag) => (tag.id === id ? updatedTag : tag)) || [],
        false
      );
      toast.success("タグを更新しました");
      return updatedTag;
    } catch (err) {
      const message = err instanceof Error ? err.message : "タグの更新に失敗しました";
      toast.error(message);
      throw err;
    }
  }, [mutate]);

  const deleteTag = useCallback(async (id: number) => {
    try {
      await tagApiClient.deleteTag(id);
      // 楽観的更新: キャッシュからタグを削除
      await mutate((prev) => prev?.filter((tag) => tag.id !== id) || [], false);
      toast.success("タグを削除しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "タグの削除に失敗しました";
      toast.error(message);
      throw err;
    }
  }, [mutate]);

  return {
    tags: data ?? [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    fetchTags: mutate,
    createTag,
    updateTag,
    deleteTag,
  };
}
