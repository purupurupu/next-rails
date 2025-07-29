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
  const searchParamsKey = JSON.stringify(searchParams);
  const debouncedSearchParams = useMemo(() => ({
    ...searchParams,
    q: debouncedSearchQuery,
  }), [searchParamsKey, debouncedSearchQuery]);

  const searchTodos = useCallback(async (params: TodoSearchParams) => {
    try {
      setLoading(true);
      setError(null);

      const response = await todoApiClient.searchTodos(params);
      setTodos(response.todos);
      setSearchResponse(response);

      // Show suggestions if no results
      if (response.todos.length === 0 && response.suggestions?.length) {
        const mainSuggestion = response.suggestions.find((s) => s.type === "reduce_filters") || response.suggestions[0];
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
