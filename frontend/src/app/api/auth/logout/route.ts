import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_CONFIG,
  AUTH_ENDPOINTS,
} from "@/lib/auth/config";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_CONFIG.TOKEN_COOKIE_NAME)?.value;

    if (token) {
      await fetch(
        `${AUTH_CONFIG.BACKEND_URL}${AUTH_ENDPOINTS.SIGN_OUT}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      ).catch(() => {
        // Rails側のログアウトエラーは無視（Cookieは削除する）
      });
    }

    cookieStore.delete(AUTH_CONFIG.TOKEN_COOKIE_NAME);
    cookieStore.delete(AUTH_CONFIG.USER_COOKIE_NAME);

    return NextResponse.json({ message: "ログアウトしました" });
  } catch (error) {
    console.error("Logout error:", error);
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_CONFIG.TOKEN_COOKIE_NAME);
    cookieStore.delete(AUTH_CONFIG.USER_COOKIE_NAME);

    return NextResponse.json({ message: "ログアウトしました" });
  }
}
