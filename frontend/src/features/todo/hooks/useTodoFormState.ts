import { useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import type { Todo, TodoPriority, TodoStatus, CreateTodoData } from "../types/todo";

/**
 * TodoFormの状態を表すインターフェース
 */
export interface TodoFormState {
  title: string;
  dueDate: Date | undefined;
  priority: TodoPriority;
  status: TodoStatus;
  description: string;
  categoryId: number | undefined;
  selectedTagIds: number[];
  selectedFiles: File[];
  isSubmitting: boolean;
  showCalendar: boolean;
}

/**
 * TodoFormの初期値を表すインターフェース
 */
interface InitialValues {
  title?: string;
  dueDate?: Date;
  priority?: TodoPriority;
  status?: TodoStatus;
  description?: string;
  categoryId?: number;
  tagIds?: number[];
}

/**
 * useTodoFormStateの戻り値
 */
export interface UseTodoFormStateReturn {
  // State
  state: TodoFormState;

  // Setters
  setTitle: (title: string) => void;
  setDueDate: (date: Date | undefined) => void;
  setPriority: (priority: TodoPriority) => void;
  setStatus: (status: TodoStatus) => void;
  setDescription: (description: string) => void;
  setCategoryId: (categoryId: number | undefined) => void;
  setSelectedTagIds: (tagIds: number[]) => void;
  setSelectedFiles: (files: File[]) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setShowCalendar: (show: boolean) => void;

  // Actions
  resetForm: () => void;
  initializeFromTodo: (todo: Todo) => void;
  clearDueDate: () => void;
  getSubmitData: () => CreateTodoData;

  // Computed
  isValid: boolean;
}

const defaultState: TodoFormState = {
  title: "",
  dueDate: undefined,
  priority: "medium",
  status: "pending",
  description: "",
  categoryId: undefined,
  selectedTagIds: [],
  selectedFiles: [],
  isSubmitting: false,
  showCalendar: false,
};

/**
 * TodoFormの状態管理を行うカスタムhook
 *
 * @param initialValues - 初期値（オプション）
 * @returns フォーム状態と操作関数
 *
 * @example
 * ```tsx
 * function TodoForm({ todo }) {
 *   const form = useTodoFormState();
 *
 *   useEffect(() => {
 *     if (todo) {
 *       form.initializeFromTodo(todo);
 *     }
 *   }, [todo]);
 *
 *   const handleSubmit = async () => {
 *     if (!form.isValid) return;
 *     form.setIsSubmitting(true);
 *     try {
 *       await submitTodo(form.getSubmitData(), form.state.selectedFiles);
 *       form.resetForm();
 *     } finally {
 *       form.setIsSubmitting(false);
 *     }
 *   };
 * }
 * ```
 */
export function useTodoFormState(initialValues?: InitialValues): UseTodoFormStateReturn {
  const [state, setState] = useState<TodoFormState>(() => ({
    ...defaultState,
    title: initialValues?.title ?? "",
    dueDate: initialValues?.dueDate,
    priority: initialValues?.priority ?? "medium",
    status: initialValues?.status ?? "pending",
    description: initialValues?.description ?? "",
    categoryId: initialValues?.categoryId,
    selectedTagIds: initialValues?.tagIds ?? [],
  }));

  // Individual setters
  const setTitle = useCallback((title: string) => {
    setState((prev) => ({ ...prev, title }));
  }, []);

  const setDueDate = useCallback((dueDate: Date | undefined) => {
    setState((prev) => ({ ...prev, dueDate }));
  }, []);

  const setPriority = useCallback((priority: TodoPriority) => {
    setState((prev) => ({ ...prev, priority }));
  }, []);

  const setStatus = useCallback((status: TodoStatus) => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setCategoryId = useCallback((categoryId: number | undefined) => {
    setState((prev) => ({ ...prev, categoryId }));
  }, []);

  const setSelectedTagIds = useCallback((selectedTagIds: number[]) => {
    setState((prev) => ({ ...prev, selectedTagIds }));
  }, []);

  const setSelectedFiles = useCallback((selectedFiles: File[]) => {
    setState((prev) => ({ ...prev, selectedFiles }));
  }, []);

  const setIsSubmitting = useCallback((isSubmitting: boolean) => {
    setState((prev) => ({ ...prev, isSubmitting }));
  }, []);

  const setShowCalendar = useCallback((showCalendar: boolean) => {
    setState((prev) => ({ ...prev, showCalendar }));
  }, []);

  // Actions
  const resetForm = useCallback(() => {
    setState(defaultState);
  }, []);

  const initializeFromTodo = useCallback((todo: Todo) => {
    setState({
      title: todo.title,
      dueDate: todo.due_date ? new Date(todo.due_date) : undefined,
      priority: todo.priority,
      status: todo.status,
      description: todo.description ?? "",
      categoryId: todo.category?.id,
      selectedTagIds: todo.tags?.map((tag) => tag.id) ?? [],
      selectedFiles: [],
      isSubmitting: false,
      showCalendar: false,
    });
  }, []);

  const clearDueDate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dueDate: undefined,
      showCalendar: false,
    }));
  }, []);

  const getSubmitData = useCallback((): CreateTodoData => {
    return {
      title: state.title.trim(),
      due_date: state.dueDate ? format(state.dueDate, "yyyy-MM-dd") : null,
      priority: state.priority,
      status: state.status,
      description: state.description.trim() || null,
      category_id: state.categoryId ?? null,
      tag_ids: state.selectedTagIds,
    };
  }, [state]);

  // Computed
  const isValid = useMemo(() => {
    return state.title.trim().length > 0;
  }, [state.title]);

  return {
    state,
    setTitle,
    setDueDate,
    setPriority,
    setStatus,
    setDescription,
    setCategoryId,
    setSelectedTagIds,
    setSelectedFiles,
    setIsSubmitting,
    setShowCalendar,
    resetForm,
    initializeFromTodo,
    clearDueDate,
    getSubmitData,
    isValid,
  };
}
