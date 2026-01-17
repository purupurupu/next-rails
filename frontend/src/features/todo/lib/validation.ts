import { z } from "zod";

/**
 * Todo優先度のスキーマ
 */
export const todoPrioritySchema = z.enum(["low", "medium", "high"], {
  message: "無効な優先度です",
});

/**
 * Todoステータスのスキーマ
 */
export const todoStatusSchema = z.enum(["pending", "in_progress", "completed"], {
  message: "無効なステータスです",
});

/**
 * Todo作成フォームのバリデーションスキーマ
 */
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "タスク名は必須です")
    .max(200, "タスク名は200文字以内で入力してください"),
  description: z
    .string()
    .max(2000, "説明は2000文字以内で入力してください")
    .nullable()
    .optional(),
  priority: todoPrioritySchema.optional().default("medium"),
  status: todoStatusSchema.optional().default("pending"),
  due_date: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  tag_ids: z.array(z.number()).optional().default([]),
});

/**
 * Todo更新フォームのバリデーションスキーマ
 */
export const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, "タスク名は必須です")
    .max(200, "タスク名は200文字以内で入力してください")
    .optional(),
  description: z
    .string()
    .max(2000, "説明は2000文字以内で入力してください")
    .nullable()
    .optional(),
  completed: z.boolean().optional(),
  priority: todoPrioritySchema.optional(),
  status: todoStatusSchema.optional(),
  due_date: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  tag_ids: z.array(z.number()).optional(),
});

/**
 * Todo検索パラメータのバリデーションスキーマ
 */
export const todoSearchParamsSchema = z.object({
  q: z.string().optional(),
  category_id: z.union([z.number(), z.array(z.number()), z.null()]).optional(),
  status: z.union([todoStatusSchema, z.array(todoStatusSchema)]).optional(),
  priority: z.union([todoPrioritySchema, z.array(todoPrioritySchema)]).optional(),
  tag_ids: z.array(z.number()).optional(),
  tag_mode: z.enum(["any", "all"]).optional(),
  due_date_from: z.string().optional(),
  due_date_to: z.string().optional(),
  sort_by: z
    .enum([
      "position",
      "created_at",
      "updated_at",
      "due_date",
      "title",
      "priority",
      "status",
    ])
    .optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().max(100).optional(),
});

/**
 * スキーマから推論される型
 */
export type CreateTodoFormValues = z.infer<typeof createTodoSchema>;
export type UpdateTodoFormValues = z.infer<typeof updateTodoSchema>;
export type TodoSearchParamsValues = z.infer<typeof todoSearchParamsSchema>;
