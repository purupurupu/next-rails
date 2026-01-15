import { cookies } from "next/headers";
import { AUTH_CONFIG } from "@/lib/auth/config";

/**
 * サーバーサイド専用のAPI Client
 * Server ComponentからRails APIへの直接フェッチに使用
 */

export class ServerApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ServerApiError";
  }
}

interface ServerFetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

/**
 * サーバーサイドからRails APIへのfetch
 * cookiesからJWTトークンを取得してAuthorizationヘッダーに設定
 */
export async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.TOKEN_COOKIE_NAME)?.value;

  const url = `${AUTH_CONFIG.BACKEND_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    let details: Record<string, string[]> | undefined;

    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error.message || errorMessage;
        details = errorData.error.details;
      }
    } catch {
      // JSON parse failed, use default error message
    }

    throw new ServerApiError(errorMessage, response.status, details);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * GETリクエスト
 */
export async function serverGet<T>(endpoint: string): Promise<T> {
  return serverFetch<T>(endpoint, { method: "GET" });
}

/**
 * POSTリクエスト
 */
export async function serverPost<T>(
  endpoint: string,
  data?: unknown,
): Promise<T> {
  return serverFetch<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * 認証状態の検証
 * トークンが有効かどうかを確認
 */
export async function verifyAuth(): Promise<{
  isAuthenticated: boolean;
  user: { id: number; email: string; name: string } | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.TOKEN_COOKIE_NAME)?.value;

  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  try {
    const response = await serverGet<{ user: { id: number; email: string; name: string } }>(
      "/auth/me",
    );
    return { isAuthenticated: true, user: response.user };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}
