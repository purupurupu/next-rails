import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useTodoMutations } from "./useTodoMutations";
import type { Todo, CreateTodoData, UpdateTodoData, UpdateOrderData, TodoFilter } from "../types/todo";
import { TODO_FILTERS } from "@/lib/constants";

interface UseTodosReturn {
  // State
  todos: Todo[];
  allTodos: Todo[];
  loading: boolean;
  error: string | null;
  filter: TodoFilter;
  counts: {
    all: number;
    active: number;
    completed: number;
  };
  // Actions
  createTodo: (data: CreateTodoData, files?: File[]) => Promise<void>;
  updateTodo: (id: number, data: UpdateTodoData, files?: File[]) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  updateTodoOrder: (todos: UpdateOrderData[]) => Promise<void>;
  toggleTodoComplete: (id: number) => Promise<void>;
  setFilter: (filter: TodoFilter) => void;
  refreshTodos: () => Promise<void>;
  deleteTodoFile: (todoId: number, fileId: string | number) => Promise<void>;
}

/**
 * Main todos hook that combines all todo-related functionality
 * Integrates: state management, CRUD operations, filtering, and initial loading
 *
 * Refactored to integrate useTodosState and useTodosFilter directly
 */
export function useTodos(): UseTodosReturn {
  // State management (integrated from useTodosState)
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoFilter>(TODO_FILTERS.ALL);

  // CRUD operations with optimistic updates
  const mutations = useTodoMutations({
    allTodos,
    setAllTodos,
    setError,
  });

  // Filtering (integrated from useTodosFilter)
  const todos = useMemo(() => {
    return allTodos.filter((todo) => {
      switch (filter) {
        case TODO_FILTERS.ACTIVE:
          return !todo.completed;
        case TODO_FILTERS.COMPLETED:
          return todo.completed;
        default:
          return true;
      }
    });
  }, [allTodos, filter]);

  // Calculate counts (integrated from useTodosFilter)
  const counts = useMemo(() => {
    let active = 0;
    let completed = 0;
    for (const todo of allTodos) {
      if (todo.completed) {
        completed++;
      } else {
        active++;
      }
    }
    return { all: allTodos.length, active, completed };
  }, [allTodos]);

  // Enhanced refresh function with loading state
  const refreshTodos = useCallback(async () => {
    setLoading(true);
    try {
      await mutations.refreshTodos();
    } finally {
      setLoading(false);
    }
  }, [mutations]);

  // Initial load with useRef pattern (eliminates eslint-disable)
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      refreshTodos();
    }
  }, [refreshTodos]);

  return {
    // State
    todos,
    allTodos,
    loading,
    error,
    filter,
    counts,
    // Actions
    createTodo: mutations.createTodo,
    updateTodo: mutations.updateTodo,
    deleteTodo: mutations.deleteTodo,
    updateTodoOrder: mutations.updateTodoOrder,
    toggleTodoComplete: mutations.toggleTodoComplete,
    setFilter,
    refreshTodos,
    deleteTodoFile: mutations.deleteTodoFile,
  };
}
