import type { BaseEntity, ValidationErrors } from "@/types/common";
import type { Category } from "@/features/category/types/category";

/**
 * Todo domain types
 */

// Enums
export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "pending" | "in_progress" | "completed";
export type TodoFilter = "all" | "active" | "completed";

// Category reference (simplified version for todos)
export type TodoCategoryRef = Pick<Category, "id" | "name" | "color">;

// Main todo entity
export interface Todo extends BaseEntity {
  title: string;
  completed: boolean;
  position: number;
  due_date: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  description: string | null;
  category: TodoCategoryRef | null;
}

// Todo operations
export interface CreateTodoData {
  title: string;
  due_date?: string | null;
  priority?: TodoPriority;
  status?: TodoStatus;
  description?: string | null;
  category_id?: number | null;
}

export interface UpdateTodoData {
  title?: string;
  completed?: boolean;
  due_date?: string | null;
  priority?: TodoPriority;
  status?: TodoStatus;
  description?: string | null;
  category_id?: number | null;
}

export interface UpdateOrderData {
  id: number;
  position: number;
}

// Error types
export type TodoValidationErrors = ValidationErrors;

// For backward compatibility (can be removed after migration)
export interface TodoCategory {
  id: number;
  name: string;
  color: string;
}

export interface TodoError {
  title?: string[];
  priority?: string[];
  status?: string[];
  description?: string[];
  due_date?: string[];
  base?: string[];
}
