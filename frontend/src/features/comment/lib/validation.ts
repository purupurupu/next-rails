import { z } from "zod";

/**
 * コメント作成フォームのバリデーションスキーマ
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "コメントを入力してください")
    .max(1000, "コメントは1000文字以内で入力してください"),
});

/**
 * コメント更新フォームのバリデーションスキーマ
 */
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "コメントを入力してください")
    .max(1000, "コメントは1000文字以内で入力してください"),
});

/**
 * スキーマから推論される型
 */
export type CreateCommentFormValues = z.infer<typeof createCommentSchema>;
export type UpdateCommentFormValues = z.infer<typeof updateCommentSchema>;
