import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  AUTH_CONFIG,
  AUTH_ENDPOINTS,
} from "@/lib/auth/config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${AUTH_CONFIG.BACKEND_URL}${AUTH_ENDPOINTS.SIGN_UP}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    // async-api-routes: response.json()は1回のみ呼び出し
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.status?.message || "登録に失敗しました",
          details: data.error?.details,
        },
        { status: response.status },
      );
    }
    const authHeader = response.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "認証トークンを受信できませんでした" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const cookieStore = await cookies();

    cookieStore.set(
      AUTH_CONFIG.TOKEN_COOKIE_NAME,
      token,
      AUTH_CONFIG.COOKIE_OPTIONS,
    );

    cookieStore.set(
      AUTH_CONFIG.USER_COOKIE_NAME,
      JSON.stringify(data.data),
      AUTH_CONFIG.USER_COOKIE_OPTIONS,
    );

    return NextResponse.json({
      user: data.data,
      message: "アカウントを作成しました",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "ネットワークエラーが発生しました" },
      { status: 500 },
    );
  }
}
