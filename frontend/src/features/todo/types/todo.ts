import type { BaseEntity, ValidationErrors } from "@/types/common";
import type { Category } from "@/features/category/types/category";
import type { Tag } from "@/features/tag/types/tag";

/**
 * Todo domain types
 */

// Enums
export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "pending" | "in_progress" | "completed";
export type TodoFilter = "all" | "active" | "completed";

// Category reference (simplified version for todos)
export type TodoCategoryRef = Pick<Category, "id" | "name" | "color">;

// Tag reference (simplified version for todos)
export type TodoTagRef = Pick<Tag, "id" | "name" | "color">;

// File type (Active Storage format)
export interface TodoFile {
  id: string | number;
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
  variants?: {
    thumb?: string;
    medium?: string;
  };
}

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
  tags: TodoTagRef[];
  files: TodoFile[];
}

// Todo operations
export interface CreateTodoData {
  title: string;
  due_date?: string | null;
  priority?: TodoPriority;
  status?: TodoStatus;
  description?: string | null;
  category_id?: number | null;
  tag_ids?: number[];
}

export interface UpdateTodoData {
  title?: string;
  completed?: boolean;
  due_date?: string | null;
  priority?: TodoPriority;
  status?: TodoStatus;
  description?: string | null;
  category_id?: number | null;
  tag_ids?: number[];
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
