import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_CONFIG,
  AUTH_ENDPOINTS,
} from "@/lib/auth/config";

export async function POST() {
  // async-defer-await: cookies()は関数冒頭で1回のみ呼び出し
  const cookieStore = await cookies();

  try {
    const token = cookieStore.get(AUTH_CONFIG.TOKEN_COOKIE_NAME)?.value;

    if (token) {
      // fire-and-forget: awaitせずに実行（レスポンスを待たない）
      fetch(
        `${AUTH_CONFIG.BACKEND_URL}${AUTH_ENDPOINTS.SIGN_OUT}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      ).catch(() => {
        // Rails側のログアウトエラーは無視（Cookieは削除する）
      });
    }

    cookieStore.delete(AUTH_CONFIG.TOKEN_COOKIE_NAME);
    cookieStore.delete(AUTH_CONFIG.USER_COOKIE_NAME);

    return NextResponse.json({ message: "ログアウトしました" });
  } catch (error) {
    console.error("Logout error:", error);
    // cookieStoreは既に取得済みなので再利用
    cookieStore.delete(AUTH_CONFIG.TOKEN_COOKIE_NAME);
    cookieStore.delete(AUTH_CONFIG.USER_COOKIE_NAME);

    return NextResponse.json({ message: "ログアウトしました" });
  }
}
