import type { ZodError, ZodType } from "zod";

/**
 * Zodバリデーション結果の型
 */
export type ValidationResult<T>
  = | { success: true; data: T }
    | { success: false; errors: Record<string, string[]> };

/**
 * ZodErrorからフィールドごとのエラーメッセージを抽出する
 *
 * @param error - Zodのエラーオブジェクト
 * @returns フィールド名をキー、エラーメッセージ配列を値とするオブジェクト
 * @example
 * ```typescript
 * const errors = formatZodErrors(zodError);
 * // { title: ["タスク名は必須です"], priority: ["無効な優先度です"] }
 * ```
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_root";
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

/**
 * Zodスキーマでデータをバリデーションする
 *
 * @param schema - Zodスキーマ
 * @param data - バリデーション対象のデータ
 * @returns バリデーション結果（成功時はdata、失敗時はerrorsを含む）
 * @example
 * ```typescript
 * const result = validateForm(todoFormSchema, formData);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.log(result.errors);
 * }
 * ```
 */
export function validateForm<T>(
  schema: ZodType<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * 最初のエラーメッセージのみを取得する
 *
 * @param errors - フィールドごとのエラーメッセージ
 * @returns フィールド名をキー、最初のエラーメッセージを値とするオブジェクト
 */
export function getFirstErrors(
  errors: Record<string, string[]>,
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, messages] of Object.entries(errors)) {
    if (messages.length > 0) {
      result[key] = messages[0];
    }
  }

  return result;
}
