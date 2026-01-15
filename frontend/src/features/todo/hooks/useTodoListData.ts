"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { todoApiClient } from "../lib/api-client";
import { categoryApiClient } from "@/features/category/lib/api-client";
import { tagApiClient } from "@/features/tag/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import type { Todo, TodoSearchParams, TodoSearchResponse } from "../types/todo";
import type { Category } from "@/features/category/types/category";
import type { Tag } from "@/features/tag/types/tag";
import { toast } from "sonner";

interface TodoListData {
  todos: Todo[];
  searchResponse: TodoSearchResponse | null;
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
}

interface UseTodoListDataReturn extends TodoListData {
  refresh: () => Promise<void>;
}

/**
 * Options for useTodoListData
 * Can provide initial data from Server Component for SSR
 */
interface UseTodoListDataOptions {
  initialTodos?: Todo[];
  initialCategories?: Category[];
  initialTags?: Tag[];
  initialSearchResponse?: TodoSearchResponse | null;
}

/**
 * 並列データフェッチ hook (async-parallel ルール適用)
 *
 * useTodoSearch, useCategories, useTags を統合し、
 * Promise.all() で並列実行することでWaterfallsを解消
 *
 * Supports initial data from Server Component for SSR
 */
export function useTodoListData(
  searchParams: TodoSearchParams,
  options: UseTodoListDataOptions = {},
): UseTodoListDataReturn {
  const hasInitialData = options.initialTodos !== undefined && options.initialTodos.length > 0;

  const [data, setData] = useState<TodoListData>({
    todos: options.initialTodos ?? [],
    searchResponse: options.initialSearchResponse ?? null,
    categories: options.initialCategories ?? [],
    tags: options.initialTags ?? [],
    loading: !hasInitialData,
    error: null,
  });

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchParams.q || "", 300);

  // Create debounced search params with stable reference
  const debouncedSearchParams = useMemo(() => ({
    ...searchParams,
    q: debouncedSearchQuery,
  }), [searchParams, debouncedSearchQuery]);

  // fetchAll receives params as argument to avoid dependency issues
  const fetchAll = useCallback(async (params: TodoSearchParams) => {
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Promise.all で並列実行 (async-parallel ルール)
      // 3つの独立したAPIコールを同時に開始
      const [searchResult, categoriesResult, tagsResult] = await Promise.all([
        todoApiClient.searchTodos(params),
        categoryApiClient.getCategories(),
        tagApiClient.getTags(),
      ]);

      // Parse search result (handle different API response formats)
      let todos: Todo[] = [];
      let searchResponse: TodoSearchResponse | null = null;

      if (Array.isArray(searchResult)) {
        // Direct array response (fallback)
        todos = searchResult;
        searchResponse = {
          data: searchResult,
          meta: {
            total: searchResult.length,
            current_page: 1,
            total_pages: 1,
            per_page: searchResult.length,
            search_query: params.q,
            filters_applied: {},
          },
          suggestions: [],
        };
      } else if (searchResult && typeof searchResult === "object" && "data" in searchResult) {
        // v1 API structured response with data, meta, suggestions
        todos = Array.isArray(searchResult.data) ? searchResult.data : [];
        searchResponse = {
          data: todos,
          meta: searchResult.meta || {
            total: todos.length,
            current_page: 1,
            total_pages: 1,
            per_page: todos.length,
            search_query: params.q,
            filters_applied: {},
          },
          suggestions: searchResult.suggestions || [],
        };
      }

      // Show suggestions if no results
      if (todos.length === 0 && searchResponse?.suggestions && searchResponse.suggestions.length > 0) {
        const mainSuggestion = searchResponse.suggestions.find((s) => s.type === "reduce_filters")
          || searchResponse.suggestions[0];
        if (mainSuggestion) {
          toast.info(mainSuggestion.message);
        }
      }

      setData({
        todos,
        searchResponse,
        categories: categoriesResult,
        tags: tagsResult,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "データの取得に失敗しました";
      setData((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }, []);

  // Automatically fetch when params change
  useEffect(() => {
    // Skip if only search query is present and it's being typed
    if (searchParams.q && searchParams.q !== debouncedSearchQuery) {
      return;
    }

    fetchAll(debouncedSearchParams);
  }, [debouncedSearchParams, fetchAll, searchParams.q, debouncedSearchQuery]);

  // refresh function that uses current debounced params
  const refresh = useCallback(() => {
    return fetchAll(debouncedSearchParams);
  }, [fetchAll, debouncedSearchParams]);

  return {
    ...data,
    refresh,
  };
}
