"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { categoryApiClient, ApiError } from "../lib/api-client";
import type { Category, CreateCategoryData, UpdateCategoryData } from "../types/category";
import { toast } from "sonner";

// SWR fetcher
const fetcher = () => categoryApiClient.getCategories();

/**
 * カテゴリー管理 hook (client-swr-dedup ルール適用)
 *
 * SWRによる自動リクエスト重複排除とキャッシュ管理
 */
export function useCategories(fetchOnMount = true) {
  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    fetchOnMount ? "/api/v1/categories" : null,
    fetcher,
    {
      dedupingInterval: 60000, // 1分間の重複排除
      revalidateOnFocus: false,
    }
  );

  const createCategory = useCallback(async (categoryData: CreateCategoryData) => {
    try {
      const newCategory = await categoryApiClient.createCategory(categoryData);
      // 楽観的更新: キャッシュに新しいカテゴリーを追加
      await mutate((prev) => [...(prev || []), newCategory], false);
      toast.success("カテゴリーを作成しました");
      return newCategory;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error("Failed to create category");
      toast.error(error.message);
      throw error;
    }
  }, [mutate]);

  const updateCategory = useCallback(async (id: number, categoryData: UpdateCategoryData) => {
    try {
      const updatedCategory = await categoryApiClient.updateCategory(id, categoryData);
      // 楽観的更新: キャッシュ内のカテゴリーを更新
      await mutate(
        (prev) => prev?.map((cat) => (cat.id === id ? updatedCategory : cat)) || [],
        false
      );
      toast.success("カテゴリーを更新しました");
      return updatedCategory;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error("Failed to update category");
      toast.error(error.message);
      throw error;
    }
  }, [mutate]);

  const deleteCategory = useCallback(async (id: number) => {
    try {
      await categoryApiClient.deleteCategory(id);
      // 楽観的更新: キャッシュからカテゴリーを削除
      await mutate((prev) => prev?.filter((cat) => cat.id !== id) || [], false);
      toast.success("カテゴリーを削除しました");
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error("Failed to delete category");
      toast.error(error.message);
      throw error;
    }
  }, [mutate]);

  return {
    categories: data ?? [],
    isLoading,
    error: error instanceof Error ? error : null,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories: mutate,
    refetch: mutate,
  };
}
