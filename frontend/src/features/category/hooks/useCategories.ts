"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { categoryApiClient } from "../lib/api-client";
import type { Category, CreateCategoryData, UpdateCategoryData } from "../types/category";
import { API_ENDPOINTS } from "@/lib/constants";
import { defaultSWRConfig } from "@/lib/swr-config";
import { getErrorMessage, normalizeError } from "@/lib/error-utils";

// SWR fetcher
const fetcher = () => categoryApiClient.getCategories();

interface UseCategoriesOptions {
  initialData?: Category[];
}

/**
 * カテゴリー管理 hook
 *
 * @remarks
 * SWRによる自動リクエスト重複排除とキャッシュ管理を提供
 *
 * @param fetchOnMount - マウント時にデータを取得するかどうか（デフォルト: true）
 * @param options - 初期データなどのオプション
 * @returns カテゴリーデータと CRUD 操作関数
 *
 * @example
 * ```typescript
 * const { categories, createCategory, updateCategory, deleteCategory } = useCategories();
 * await createCategory({ name: "仕事", color: "#0000ff" });
 * ```
 */
export function useCategories(fetchOnMount = true, options: UseCategoriesOptions = {}) {
  const hasInitialData = options.initialData !== undefined;

  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    fetchOnMount ? API_ENDPOINTS.CATEGORIES : null,
    fetcher,
    {
      ...defaultSWRConfig,
      fallbackData: options.initialData,
      revalidateIfStale: !hasInitialData,
      revalidateOnMount: !hasInitialData,
    },
  );

  /**
   * 新しいカテゴリーを作成する
   */
  const createCategory = useCallback(
    async (categoryData: CreateCategoryData) => {
      try {
        const newCategory = await categoryApiClient.createCategory(categoryData);
        // 楽観的更新: キャッシュに新しいカテゴリーを追加
        await mutate((prev) => [...(prev || []), newCategory], false);
        toast.success("カテゴリーを作成しました");
        return newCategory;
      } catch (err) {
        const message = getErrorMessage(err, "カテゴリーの作成に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [mutate],
  );

  /**
   * カテゴリーを更新する
   */
  const updateCategory = useCallback(
    async (id: number, categoryData: UpdateCategoryData) => {
      try {
        const updatedCategory = await categoryApiClient.updateCategory(id, categoryData);
        // 楽観的更新: キャッシュ内のカテゴリーを更新
        await mutate(
          (prev) => prev?.map((cat) => (cat.id === id ? updatedCategory : cat)) || [],
          false,
        );
        toast.success("カテゴリーを更新しました");
        return updatedCategory;
      } catch (err) {
        const message = getErrorMessage(err, "カテゴリーの更新に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [mutate],
  );

  /**
   * カテゴリーを削除する
   */
  const deleteCategory = useCallback(
    async (id: number) => {
      try {
        await categoryApiClient.deleteCategory(id);
        // 楽観的更新: キャッシュからカテゴリーを削除
        await mutate((prev) => prev?.filter((cat) => cat.id !== id) || [], false);
        toast.success("カテゴリーを削除しました");
      } catch (err) {
        const message = getErrorMessage(err, "カテゴリーの削除に失敗しました");
        toast.error(message);
        throw normalizeError(err, message);
      }
    },
    [mutate],
  );

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
