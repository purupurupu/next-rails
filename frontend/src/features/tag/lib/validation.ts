import { z } from "zod";

/**
 * カラーコードのバリデーション（#RRGGBB形式）
 */
const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "有効なカラーコード（#RRGGBB）を入力してください");

/**
 * タグ作成フォームのバリデーションスキーマ
 */
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "タグ名は必須です")
    .max(30, "タグ名は30文字以内で入力してください"),
  color: colorSchema,
});

/**
 * タグ更新フォームのバリデーションスキーマ
 */
export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1, "タグ名は必須です")
    .max(30, "タグ名は30文字以内で入力してください")
    .optional(),
  color: colorSchema.optional(),
});

/**
 * スキーマから推論される型
 */
export type CreateTagFormValues = z.infer<typeof createTagSchema>;
export type UpdateTagFormValues = z.infer<typeof updateTagSchema>;
