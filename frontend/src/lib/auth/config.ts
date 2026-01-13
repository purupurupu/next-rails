/**
 * BFF認証設定
 * httpOnly Cookieを使用したセキュアな認証管理
 */

export const AUTH_CONFIG = {
  // Cookie名
  TOKEN_COOKIE_NAME: "auth_token",
  USER_COOKIE_NAME: "auth_user",

  // Cookie設定
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24, // 1日（Rails JWT設定と一致）
  },

  // ユーザー情報Cookie設定（クライアントで読み取り可能）
  USER_COOKIE_OPTIONS: {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24,
  },

  // Rails APIのベースURL（サーバーサイドからの接続）
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:3001",
} as const;

// Rails認証エンドポイント
export const AUTH_ENDPOINTS = {
  SIGN_IN: "/auth/sign_in",
  SIGN_UP: "/auth/sign_up",
  SIGN_OUT: "/auth/sign_out",
} as const;
