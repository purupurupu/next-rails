import { cache } from "react";
import { serverGet } from "@/lib/server/api-client";
import type { Todo, TodoSearchResponse } from "../types/todo";
import type { Category } from "@/features/category/types/category";
import type { Tag } from "@/features/tag/types/tag";

/**
 * Initial data for TodoListWithSearch
 */
export interface InitialTodoData {
  todos: Todo[];
  searchResponse: TodoSearchResponse | null;
  categories: Category[];
  tags: Tag[];
}

/**
 * API response wrapper type
 */
interface ApiListResponse<T> {
  data: T[];
}

/**
 * server-cache-react: React.cache()でリクエスト内重複排除
 * 同一リクエスト内で複数回呼ばれても1回のみフェッチ
 */
const getCachedTodosSearch = cache(async () => {
  return serverGet<TodoSearchResponse>("/api/v1/todos/search");
});

const getCachedCategories = cache(async () => {
  return serverGet<ApiListResponse<Category>>("/api/v1/categories");
});

const getCachedTags = cache(async () => {
  return serverGet<ApiListResponse<Tag>>("/api/v1/tags");
});

/**
 * Fetch initial todo data from server
 * Used in Server Components for SSR
 *
 * Fetches todos, categories, and tags in parallel using Promise.all
 */
export async function fetchInitialTodoData(): Promise<InitialTodoData> {
  try {
    // Promise.all for parallel fetching with React.cache() deduplication
    const [searchResult, categoriesResult, tagsResult] = await Promise.all([
      getCachedTodosSearch(),
      getCachedCategories(),
      getCachedTags(),
    ]);

    // Parse search result
    let todos: Todo[] = [];
    let searchResponse: TodoSearchResponse | null = null;

    if (searchResult && "data" in searchResult) {
      todos = Array.isArray(searchResult.data) ? searchResult.data : [];
      searchResponse = {
        data: todos,
        meta: searchResult.meta || {
          total: todos.length,
          current_page: 1,
          total_pages: 1,
          per_page: todos.length,
          filters_applied: {},
        },
        suggestions: searchResult.suggestions || [],
      };
    }

    return {
      todos,
      searchResponse,
      categories: categoriesResult?.data || [],
      tags: tagsResult?.data || [],
    };
  } catch (error) {
    // Log error for debugging (server-side only)
    console.error("Failed to fetch initial todo data:", error);

    // Return empty data as fallback
    return {
      todos: [],
      searchResponse: null,
      categories: [],
      tags: [],
    };
  }
}

/**
 * Fetch categories from server (with React.cache() deduplication)
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const result = await getCachedCategories();
    return result?.data || [];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

/**
 * Fetch tags from server (with React.cache() deduplication)
 */
export async function fetchTags(): Promise<Tag[]> {
  try {
    const result = await getCachedTags();
    return result?.data || [];
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return [];
  }
}
