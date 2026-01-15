import { ApiError } from "./api-client";

/**
 * エラーからユーザー向けメッセージを抽出する
 *
 * @param error - 処理するエラーオブジェクト
 * @param fallback - エラーメッセージが取得できない場合のフォールバックメッセージ
 * @returns ユーザーに表示するエラーメッセージ
 *
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const message = getErrorMessage(error, "操作に失敗しました");
 *   toast.error(message);
 * }
 * ```
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

/**
 * エラーをErrorオブジェクトに正規化する
 *
 * @param error - 正規化するエラーオブジェクト
 * @param fallback - エラーメッセージが取得できない場合のフォールバックメッセージ
 * @returns 正規化されたErrorオブジェクト
 *
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const normalizedError = normalizeError(error, "予期しないエラー");
 *   setError(normalizedError);
 * }
 * ```
 */
export function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(fallback);
}

/**
 * hooks用の共通エラーハンドラー
 * エラーメッセージを抽出し、toastで表示し、正規化されたエラーを返す
 *
 * @param error - 処理するエラーオブジェクト
 * @param fallbackMessage - フォールバックメッセージ
 * @param showToast - toastを表示する関数
 * @returns 正規化されたErrorオブジェクト
 *
 * @example
 * ```typescript
 * const createCategory = async (data: CreateCategoryData) => {
 *   try {
 *     const result = await categoryApiClient.createCategory(data);
 *     toast.success("カテゴリーを作成しました");
 *     return result;
 *   } catch (err) {
 *     const error = handleApiError(err, "カテゴリーの作成に失敗しました", toast.error);
 *     setError(error);
 *   }
 * };
 * ```
 */
export function handleApiError(
  error: unknown,
  fallbackMessage: string,
  showToast: (message: string) => void,
): Error {
  const message = getErrorMessage(error, fallbackMessage);
  showToast(message);
  return normalizeError(error, fallbackMessage);
}
