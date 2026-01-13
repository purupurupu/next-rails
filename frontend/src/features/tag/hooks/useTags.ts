"use client";

import { useState, useEffect, useCallback } from "react";
import { tagApiClient } from "../lib/api-client";
import type { Tag, CreateTagData, UpdateTagData } from "../types/tag";
import { toast } from "sonner";

export function useTags(fetchOnMount = true) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await tagApiClient.getTags();
      setTags(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "タグの取得に失敗しました";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTag = useCallback(async (data: CreateTagData) => {
    try {
      const newTag = await tagApiClient.createTag(data);
      setTags((prev) => [...prev, newTag]);
      toast.success("タグを作成しました");
      return newTag;
    } catch (err) {
      const message = err instanceof Error ? err.message : "タグの作成に失敗しました";
      toast.error(message);
      throw err;
    }
  }, []);

  const updateTag = useCallback(async (id: number, data: UpdateTagData) => {
    try {
      const updatedTag = await tagApiClient.updateTag(id, data);
      setTags((prev) =>
        prev.map((tag) => (tag.id === id ? updatedTag : tag)),
      );
      toast.success("タグを更新しました");
      return updatedTag;
    } catch (err) {
      const message = err instanceof Error ? err.message : "タグの更新に失敗しました";
      toast.error(message);
      throw err;
    }
  }, []);

  const deleteTag = useCallback(async (id: number) => {
    try {
      await tagApiClient.deleteTag(id);
      setTags((prev) => prev.filter((tag) => tag.id !== id));
      toast.success("タグを削除しました");
    } catch (err) {
      const message = err instanceof Error ? err.message : "タグの削除に失敗しました";
      toast.error(message);
      throw err;
    }
  }, []);

  // Load tags on mount if requested
  useEffect(() => {
    if (fetchOnMount) {
      fetchTags();
    }
  }, [fetchOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tags,
    isLoading,
    error,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
  };
}
