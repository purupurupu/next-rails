import { z } from "zod";

/**
 * カラーコードのバリデーション（#RRGGBB形式）
 */
const colorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "有効なカラーコード（#RRGGBB）を入力してください");

/**
 * カテゴリー作成フォームのバリデーションスキーマ
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "カテゴリー名は必須です")
    .max(50, "カテゴリー名は50文字以内で入力してください"),
  color: colorSchema,
});

/**
 * カテゴリー更新フォームのバリデーションスキーマ
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "カテゴリー名は必須です")
    .max(50, "カテゴリー名は50文字以内で入力してください")
    .optional(),
  color: colorSchema.optional(),
});

/**
 * スキーマから推論される型
 */
export type CreateCategoryFormValues = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormValues = z.infer<typeof updateCategorySchema>;
