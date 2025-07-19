export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "pending" | "in_progress" | "completed";

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  position: number;
  due_date: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoData {
  title: string;
  due_date?: string | null;
  priority?: TodoPriority;
  status?: TodoStatus;
  description?: string | null;
}

export interface UpdateTodoData {
  title?: string;
  completed?: boolean;
  due_date?: string | null;
  priority?: TodoPriority;
  status?: TodoStatus;
  description?: string | null;
}

export interface UpdateOrderData {
  id: number;
  position: number;
}

export interface TodosResponse {
  todos: Todo[];
}

export interface TodoError {
  title?: string[];
  due_date?: string[];
  base?: string[];
}

export type TodoFilter = "all" | "active" | "completed";
