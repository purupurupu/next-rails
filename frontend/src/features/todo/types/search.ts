import type { Todo, TodoSearchParams } from "./todo";

/**
 * @deprecated Use TodoSearchParams from "./todo" instead
 */
export type SearchParams = TodoSearchParams;

// Re-export TodoSearchParams for convenience
export type { TodoSearchParams } from "./todo";

export interface SearchMeta {
  total: number;
  current_page: number;
  total_pages: number;
  per_page: number;
  search_query?: string;
  filters_applied: Record<string, unknown>;
}

export interface SearchSuggestion {
  type: "spelling" | "broader_search" | "clear_filters" | "reduce_filters" | "status_filter" | "tag_mode";
  message: string;
  current_filters?: string[];
}

export interface SearchResponse {
  todos: Todo[];
  meta: SearchMeta;
  suggestions?: SearchSuggestion[];
}
