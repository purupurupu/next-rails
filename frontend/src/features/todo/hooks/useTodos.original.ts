import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { todoApiClient, ApiError } from "@/features/todo/lib/api-client";
import { generateOptimisticId } from "@/lib/utils";
import type {
  Todo,
  CreateTodoData,
  UpdateTodoData,
  UpdateOrderData,
  TodoFilter,
} from "@/features/todo/types/todo";
import { TODO_FILTERS } from "@/lib/constants";

interface UseTodosState {
  allTodos: Todo[];
  loading: boolean;
  error: string | null;
  filter: TodoFilter;
}

interface UseTodosActions {
  createTodo: (data: CreateTodoData) => Promise<void>;
  updateTodo: (id: number, data: UpdateTodoData) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  updateTodoOrder: (todos: UpdateOrderData[]) => Promise<void>;
  toggleTodoComplete: (id: number) => Promise<void>;
  setFilter: (filter: TodoFilter) => void;
  refreshTodos: () => Promise<void>;
}

interface UseTodosReturn extends UseTodosState, UseTodosActions {
  todos: Todo[];
}

export function useTodos(): UseTodosReturn {
  const [state, setState] = useState<UseTodosState>({
    allTodos: [],
    loading: false,
    error: null,
    filter: TODO_FILTERS.ALL,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setAllTodos = useCallback((todos: Todo[] | ((prev: Todo[]) => Todo[])) => {
    setState((prev) => ({
      ...prev,
      allTodos: typeof todos === "function" ? todos(prev.allTodos) : todos,
    }));
  }, []);

  const setFilter = useCallback((filter: TodoFilter) => {
    setState((prev) => ({ ...prev, filter }));
  }, []);

  const refreshTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const todos = await todoApiClient.getTodos();
      setAllTodos(todos);
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? error.message
        : "An unexpected error occurred";
      setError(errorMessage);
      toast.error("タスクの読み込みに失敗しました", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setAllTodos]);

  const createTodo = useCallback(async (data: CreateTodoData) => {
    setError(null);

    // Optimistic update
    const optimisticTodo: Todo = {
      id: generateOptimisticId(),
      title: data.title,
      completed: false,
      position: state.allTodos.length + 1,
      due_date: data.due_date || null,
      priority: data.priority || "medium",
      status: data.status || "pending",
      description: data.description || null,
      category: null, // Will be updated when real todo is returned from server
      tags: [], // Will be updated when real todo is returned from server
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAllTodos([...state.allTodos, optimisticTodo]);

    try {
      const createdTodo = await todoApiClient.createTodo(data);
      setAllTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === optimisticTodo.id ? createdTodo : todo,
        ),
      );
      toast.success("タスクを作成しました");
    } catch (error) {
      // Revert optimistic update
      setAllTodos((prev: Todo[]) =>
        prev.filter((todo: Todo) => todo.id !== optimisticTodo.id),
      );

      const errorMessage = error instanceof ApiError
        ? error.message
        : "Failed to create todo";
      setError(errorMessage);
      toast.error("タスクの作成に失敗しました", {
        description: errorMessage,
      });
    }
  }, [state.allTodos, setAllTodos, setError]);

  const updateTodo = useCallback(async (id: number, data: UpdateTodoData) => {
    setError(null);

    // Optimistic update
    const originalTodos = state.allTodos;
    const updatedTodos = state.allTodos.map((todo) =>
      todo.id === id ? { ...todo, ...data } : todo,
    );
    setAllTodos(updatedTodos);

    try {
      const updatedTodo = await todoApiClient.updateTodo(id, data);
      setAllTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === id ? updatedTodo : todo,
        ),
      );
      toast.success("タスクを更新しました");
    } catch (error) {
      // Revert optimistic update
      setAllTodos(originalTodos);

      const errorMessage = error instanceof ApiError
        ? error.message
        : "Failed to update todo";
      setError(errorMessage);
      toast.error("タスクの更新に失敗しました", {
        description: errorMessage,
      });
    }
  }, [state.allTodos, setAllTodos, setError]);

  const deleteTodo = useCallback(async (id: number) => {
    setError(null);

    // Optimistic update
    const originalTodos = state.allTodos;
    const filteredTodos = state.allTodos.filter((todo) => todo.id !== id);
    setAllTodos(filteredTodos);

    try {
      await todoApiClient.deleteTodo(id);
      toast.success("タスクを削除しました");
    } catch (error) {
      // Revert optimistic update
      setAllTodos(originalTodos);

      const errorMessage = error instanceof ApiError
        ? error.message
        : "Failed to delete todo";
      setError(errorMessage);
      toast.error("タスクの削除に失敗しました", {
        description: errorMessage,
      });
    }
  }, [state.allTodos, setAllTodos, setError]);

  const updateTodoOrder = useCallback(async (reorderedTodos: UpdateOrderData[]) => {
    setError(null);

    // Optimistic update
    const originalTodos = state.allTodos;
    const updatedTodos = [...state.allTodos].sort((a, b) => {
      const aData = reorderedTodos.find((item) => item.id === a.id);
      const bData = reorderedTodos.find((item) => item.id === b.id);
      return (aData?.position || 0) - (bData?.position || 0);
    });
    setAllTodos(updatedTodos);

    try {
      await todoApiClient.updateTodoOrder(reorderedTodos);
      toast.success("タスクの順序を更新しました");
    } catch (error) {
      // Revert optimistic update
      setAllTodos(originalTodos);

      const errorMessage = error instanceof ApiError
        ? error.message
        : "Failed to update todo order";
      setError(errorMessage);
      toast.error("タスクの順序更新に失敗しました", {
        description: errorMessage,
      });
    }
  }, [state.allTodos, setAllTodos, setError]);

  const toggleTodoComplete = useCallback(async (id: number) => {
    const todo = state.allTodos.find((t) => t.id === id);
    if (!todo) return;

    await updateTodo(id, { completed: !todo.completed });
  }, [state.allTodos, updateTodo]);

  // Initial load
  useEffect(() => {
    refreshTodos();
  }, [refreshTodos]);

  // Filter todos based on current filter
  const filteredTodos = state.allTodos.filter((todo) => {
    switch (state.filter) {
      case TODO_FILTERS.ACTIVE:
        return !todo.completed;
      case TODO_FILTERS.COMPLETED:
        return todo.completed;
      default:
        return true;
    }
  });

  return {
    todos: filteredTodos,
    allTodos: state.allTodos,
    loading: state.loading,
    error: state.error,
    filter: state.filter,
    createTodo,
    updateTodo,
    deleteTodo,
    updateTodoOrder,
    toggleTodoComplete,
    setFilter,
    refreshTodos,
  };
}
