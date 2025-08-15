import { useState, useEffect, useCallback, useMemo } from "react";
import { todoApiClient } from "../lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import type { Todo, TodoSearchParams, TodoSearchResponse } from "../types/todo";
import { toast } from "sonner";

interface UseTodoSearchReturn {
  todos: Todo[];
  loading: boolean;
  error: string | null;
  searchResponse: TodoSearchResponse | null;
  searchTodos: (params: TodoSearchParams) => Promise<void>;
  refreshSearch: () => Promise<void>;
}

export function useTodoSearch(searchParams: TodoSearchParams): UseTodoSearchReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<TodoSearchResponse | null>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchParams.q || "", 300);

  // Create debounced search params with stable reference
  const debouncedSearchParams = useMemo(() => ({
    ...searchParams,
    q: debouncedSearchQuery,
  }), [searchParams, debouncedSearchQuery]);

  const searchTodos = useCallback(async (params: TodoSearchParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await todoApiClient.searchTodos(params);
      console.log("Search response:", response); // Debug log

      // Handle v1 API response format
      if (Array.isArray(response)) {
        // Direct array response (fallback)
        setTodos(response);
        setSearchResponse({
          todos: response,
          meta: { total: response.length, current_page: 1, total_pages: 1, per_page: response.length, search_query: params.q, filters_applied: {} },
          suggestions: [],
        });
      } else if (response && typeof response === "object" && "data" in response) {
        // v1 API structured response with data, meta, suggestions
        const todos = Array.isArray(response.data) ? response.data : [];
        setTodos(todos);

        setSearchResponse({
          todos: todos,
          meta: response.meta || {
            total: todos.length,
            current_page: 1,
            total_pages: 1,
            per_page: todos.length,
            search_query: params.q,
            filters_applied: {},
          },
          suggestions: response.suggestions || [],
        });
      } else if (Array.isArray(response)) {
        // Simple array response
        setTodos(response);
        setSearchResponse({
          todos: response,
          meta: {
            total: response.length,
            current_page: 1,
            total_pages: 1,
            per_page: response.length,
            search_query: params.q,
            filters_applied: {},
          },
          suggestions: [],
        });
      } else {
        setTodos([]);
        setSearchResponse(null);
      }

      // Show suggestions if no results
      const todosArray = Array.isArray(response)
        ? response
        : (searchResponse?.todos || []);
      const suggestions = searchResponse?.suggestions || [];

      if (todosArray.length === 0 && suggestions.length > 0) {
        const mainSuggestion = suggestions.find((s) => s.type === "reduce_filters") || suggestions[0];
        if (mainSuggestion) {
          toast.info(mainSuggestion.message);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to search todos";
      setError(errorMessage);
      toast.error(errorMessage);
      setTodos([]);
      setSearchResponse(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSearch = useCallback(async () => {
    await searchTodos(debouncedSearchParams);
  }, [debouncedSearchParams, searchTodos]);

  // Automatically search when params change
  useEffect(() => {
    // Skip if only search query is present and it's being typed
    if (searchParams.q && searchParams.q !== debouncedSearchQuery) {
      return;
    }

    searchTodos(debouncedSearchParams);
  }, [debouncedSearchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    todos,
    loading,
    error,
    searchResponse,
    searchTodos,
    refreshSearch,
  };
}
