"use client";

import useSWR from "swr";
import { useMemo, useCallback, useRef } from "react";
import { todoApiClient } from "../lib/api-client";
import { categoryApiClient } from "@/features/category/lib/api-client";
import { tagApiClient } from "@/features/tag/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { defaultSWRConfig } from "@/lib/swr-config";
import type { Todo, TodoSearchParams, TodoSearchResponse } from "../types/todo";
import type { Category } from "@/features/category/types/category";
import type { Tag } from "@/features/tag/types/tag";

interface UseTodoListDataReturn {
  todos: Todo[];
  searchResponse: TodoSearchResponse | null;
  categories: Category[];
  tags: Tag[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  mutateOptimistic: (updater: (current: Todo[]) => Todo[]) => Promise<void>;
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
 * 検索パラメータをSWRキーに変換
 */
const getSearchKey = (params: TodoSearchParams) => {
  const searchParams = new URLSearchParams();

  if (params.q) searchParams.set("q", params.q);
  if (params.category_id !== undefined) searchParams.set("category_id", String(params.category_id));
  if (params.status) {
    const statusValue = Array.isArray(params.status) ? params.status.join(",") : params.status;
    searchParams.set("status", statusValue);
  }
  if (params.priority) {
    const priorityValue = Array.isArray(params.priority) ? params.priority.join(",") : params.priority;
    searchParams.set("priority", priorityValue);
  }
  if (params.tag_ids?.length) searchParams.set("tag_ids", params.tag_ids.join(","));
  if (params.tag_mode) searchParams.set("tag_mode", params.tag_mode);
  if (params.due_date_from) searchParams.set("due_date_from", params.due_date_from);
  if (params.due_date_to) searchParams.set("due_date_to", params.due_date_to);
  if (params.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params.sort_order) searchParams.set("sort_order", params.sort_order);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.per_page) searchParams.set("per_page", String(params.per_page));

  return `/api/v1/todos/search?${searchParams.toString()}`;
};

/**
 * 検索結果をパース
 */
const parseSearchResult = (
  searchResult: unknown,
  query?: string,
): { todos: Todo[]; searchResponse: TodoSearchResponse } => {
  let todos: Todo[] = [];
  let searchResponse: TodoSearchResponse;

  if (Array.isArray(searchResult)) {
    todos = searchResult;
    searchResponse = {
      data: searchResult,
      meta: {
        total: searchResult.length,
        current_page: 1,
        total_pages: 1,
        per_page: searchResult.length,
        search_query: query,
        filters_applied: {},
      },
      suggestions: [],
    };
  } else if (searchResult && typeof searchResult === "object" && "data" in searchResult) {
    const result = searchResult as TodoSearchResponse;
    todos = Array.isArray(result.data) ? result.data : [];
    searchResponse = {
      data: todos,
      meta: result.meta || {
        total: todos.length,
        current_page: 1,
        total_pages: 1,
        per_page: todos.length,
        search_query: query,
        filters_applied: {},
      },
      suggestions: result.suggestions || [],
    };
  } else {
    todos = [];
    searchResponse = {
      data: [],
      meta: {
        total: 0,
        current_page: 1,
        total_pages: 1,
        per_page: 50,
        search_query: query,
        filters_applied: {},
      },
      suggestions: [],
    };
  }

  return { todos, searchResponse };
};

/**
 * 並列データフェッチ hook (SWRベース)
 *
 * @remarks
 * SWRによる自動リクエスト重複排除とキャッシュ管理を提供。
 * categories, tags, todosをそれぞれ独立したSWRで管理し、
 * 同じキーのリクエストは自動的に1回にまとめられる。
 *
 * @param searchParams - 検索パラメータ
 * @param options - 初期データオプション（SSR用）
 * @returns Todoリストデータと操作関数
 */
export function useTodoListData(
  searchParams: TodoSearchParams,
  options: UseTodoListDataOptions = {},
): UseTodoListDataReturn {
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchParams.q || "", 300);

  // Create debounced search params
  const debouncedSearchParams = useMemo(
    () => ({
      ...searchParams,
      q: debouncedSearchQuery,
    }),
    [searchParams, debouncedSearchQuery],
  );

  // 検索中（デバウンス待ち）かどうか
  // Note: searchParams.q は未検索時に undefined、useDebounce は "" を返すため、
  // 比較前に undefined を "" に正規化する
  const isDebouncing = (searchParams.q ?? "") !== debouncedSearchQuery;

  // SWRキーを生成
  const searchKey = useMemo(
    () => (isDebouncing ? null : getSearchKey(debouncedSearchParams)),
    [debouncedSearchParams, isDebouncing],
  );

  // Categories (独立したSWR)
  // SSRで初期データを取得済みなので、マウント時の再フェッチをスキップ
  const {
    data: categories,
    error: categoriesError,
    mutate: mutateCategories,
  } = useSWR<Category[]>(
    "/api/v1/categories",
    () => categoryApiClient.getCategories(),
    {
      ...defaultSWRConfig,
      fallbackData: options.initialCategories,
      revalidateIfStale: false,
      revalidateOnMount: false,
    },
  );

  // Tags (独立したSWR)
  const {
    data: tags,
    error: tagsError,
    mutate: mutateTags,
  } = useSWR<Tag[]>(
    "/api/v1/tags",
    () => tagApiClient.getTags(),
    {
      ...defaultSWRConfig,
      fallbackData: options.initialTags,
      revalidateIfStale: false,
      revalidateOnMount: false,
    },
  );

  // Todos (検索パラメータに依存したSWR)
  // SSRで初期データを取得済みなので、マウント時の再フェッチをスキップ
  const {
    data: searchData,
    error: searchError,
    isLoading: searchLoading,
    mutate: mutateSearch,
  } = useSWR<{ todos: Todo[]; searchResponse: TodoSearchResponse }>(
    searchKey,
    async () => {
      const result = await todoApiClient.searchTodos(debouncedSearchParams);
      return parseSearchResult(result, debouncedSearchParams.q);
    },
    {
      ...defaultSWRConfig,
      fallbackData:
        options.initialTodos && options.initialSearchResponse
          ? { todos: options.initialTodos, searchResponse: options.initialSearchResponse }
          : undefined,
      revalidateIfStale: false,
      revalidateOnMount: false,
    },
  );

  // fallbackData はSWRキャッシュに格納されないため、ref 経由で最新値を参照する
  const searchDataRef = useRef(searchData);
  searchDataRef.current = searchData;

  // refresh で最新の検索パラメータを使うための ref
  const debouncedSearchParamsRef = useRef(debouncedSearchParams);
  debouncedSearchParamsRef.current = debouncedSearchParams;

  // エラーメッセージを統合
  const error = useMemo(() => {
    if (searchError) return searchError instanceof Error ? searchError.message : "検索に失敗しました";
    if (categoriesError)
      return categoriesError instanceof Error ? categoriesError.message : "カテゴリーの取得に失敗しました";
    if (tagsError) return tagsError instanceof Error ? tagsError.message : "タグの取得に失敗しました";
    return null;
  }, [searchError, categoriesError, tagsError]);

  // refresh: API を直接呼んで SWR キャッシュに書き込む
  // SWR の revalidation 機構を経由しないことで、dedupingInterval や
  // revalidateOnMount: false などの設定に影響されず確実に最新データを取得する
  const refresh = useCallback(async () => {
    const params = debouncedSearchParamsRef.current;
    const [searchResult] = await Promise.all([
      todoApiClient.searchTodos(params),
      mutateCategories(),
      mutateTags(),
    ]);
    const parsed = parseSearchResult(searchResult, params.q);
    await mutateSearch(parsed, { revalidate: false });
  }, [mutateSearch, mutateCategories, mutateTags]);

  // SWRキャッシュを直接更新する Optimistic update 関数
  // Note: fallbackData はSWRキャッシュに入らないため、
  // updater の current が undefined の場合は searchDataRef から取得する
  const mutateOptimistic = useCallback(async (
    updater: (current: Todo[]) => Todo[],
  ) => {
    await mutateSearch(
      (current) => {
        const base = current ?? searchDataRef.current;
        if (!base) return current;
        const newTodos = updater(base.todos);
        return {
          todos: newTodos,
          searchResponse: {
            ...base.searchResponse,
            data: newTodos,
            meta: {
              ...base.searchResponse.meta,
              total: newTodos.length,
            },
          },
        };
      },
      { revalidate: false },
    );
  }, [mutateSearch]);

  return {
    todos: searchData?.todos ?? options.initialTodos ?? [],
    searchResponse: searchData?.searchResponse ?? options.initialSearchResponse ?? null,
    categories: categories ?? options.initialCategories ?? [],
    tags: tags ?? options.initialTags ?? [],
    loading: searchLoading || isDebouncing,
    error,
    refresh,
    mutateOptimistic,
  };
}
