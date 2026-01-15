import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_CONFIG, AUTH_ENDPOINTS } from "@/lib/auth/config";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_CONFIG.TOKEN_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 },
      );
    }

    // Rails APIでトークン検証
    const response = await fetch(
      `${AUTH_CONFIG.BACKEND_URL}${AUTH_ENDPOINTS.ME}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      // トークン無効 → Cookie削除
      cookieStore.delete(AUTH_CONFIG.TOKEN_COOKIE_NAME);
      cookieStore.delete(AUTH_CONFIG.USER_COOKIE_NAME);
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 },
      );
    }

    const data = await response.json();
    return NextResponse.json({
      authenticated: true,
      user: data.data,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 },
    );
  }
}
