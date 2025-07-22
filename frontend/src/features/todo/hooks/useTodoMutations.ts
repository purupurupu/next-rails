import { useCallback } from "react";
import { toast } from "sonner";
import { todoApiClient, ApiError } from "@/features/todo/lib/api-client";
import type { Todo, CreateTodoData, UpdateTodoData, UpdateOrderData } from "../types/todo";
import {
  createOptimisticTodo,
  applyOptimisticUpdate,
  applyOptimisticOrder,
  addOptimisticTodo,
  removeOptimisticTodo,
  updateOptimisticTodo,
} from "./todo-optimistic-utils";

interface TodoMutationsParams {
  allTodos: Todo[];
  setAllTodos: (todos: Todo[] | ((prev: Todo[]) => Todo[])) => void;
  setError: (error: string | null) => void;
}

interface UseTodoMutationsReturn {
  createTodo: (data: CreateTodoData) => Promise<void>;
  updateTodo: (id: number, data: UpdateTodoData) => Promise<void>;
  deleteTodo: (id: number) => Promise<void>;
  updateTodoOrder: (todos: UpdateOrderData[]) => Promise<void>;
  toggleTodoComplete: (id: number) => Promise<void>;
  refreshTodos: () => Promise<void>;
}

/**
 * Hook for todo CRUD operations with optimistic updates
 * Handles: API calls, optimistic updates, error handling, toast notifications
 */
export function useTodoMutations({
  allTodos,
  setAllTodos,
  setError,
}: TodoMutationsParams): UseTodoMutationsReturn {
  const refreshTodos = useCallback(async () => {
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
    }
  }, [setAllTodos, setError]);

  const createTodo = useCallback(async (data: CreateTodoData) => {
    setError(null);

    // Optimistic update
    const optimisticTodo = createOptimisticTodo(data, allTodos.length);
    setAllTodos((prev) => addOptimisticTodo(prev, optimisticTodo));

    try {
      const createdTodo = await todoApiClient.createTodo(data);
      setAllTodos((prev) => updateOptimisticTodo(prev, optimisticTodo.id, createdTodo));
      toast.success("タスクを作成しました");
    } catch (error) {
      // Revert optimistic update
      setAllTodos((prev) => removeOptimisticTodo(prev, optimisticTodo.id));

      const errorMessage = error instanceof ApiError
        ? error.message
        : "Failed to create todo";
      setError(errorMessage);
      toast.error("タスクの作成に失敗しました", {
        description: errorMessage,
      });
    }
  }, [allTodos.length, setAllTodos, setError]);

  const updateTodo = useCallback(async (id: number, data: UpdateTodoData) => {
    setError(null);

    // Optimistic update
    const originalTodos = allTodos;
    setAllTodos((prev) => applyOptimisticUpdate(prev, id, data));

    try {
      const updatedTodo = await todoApiClient.updateTodo(id, data);
      setAllTodos((prev) => prev.map((todo) => todo.id === id ? updatedTodo : todo));
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
  }, [allTodos, setAllTodos, setError]);

  const deleteTodo = useCallback(async (id: number) => {
    setError(null);

    // Optimistic update
    const originalTodos = allTodos;
    setAllTodos((prev) => removeOptimisticTodo(prev, id));

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
  }, [allTodos, setAllTodos, setError]);

  const updateTodoOrder = useCallback(async (reorderedTodos: UpdateOrderData[]) => {
    setError(null);

    // Optimistic update
    const originalTodos = allTodos;
    setAllTodos((prev) => applyOptimisticOrder(prev, reorderedTodos));

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
  }, [allTodos, setAllTodos, setError]);

  const toggleTodoComplete = useCallback(async (id: number) => {
    const todo = allTodos.find((t) => t.id === id);
    if (!todo) return;

    await updateTodo(id, { completed: !todo.completed });
  }, [allTodos, updateTodo]);

  return {
    createTodo,
    updateTodo,
    deleteTodo,
    updateTodoOrder,
    toggleTodoComplete,
    refreshTodos,
  };
}
