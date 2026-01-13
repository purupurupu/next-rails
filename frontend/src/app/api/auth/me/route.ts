import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_CONFIG } from "@/lib/auth/config";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_CONFIG.TOKEN_COOKIE_NAME)?.value;
    const userCookie = cookieStore.get(AUTH_CONFIG.USER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 },
      );
    }

    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        return NextResponse.json({
          authenticated: true,
          user,
        });
      } catch {
        // パースエラーの場合は認証なしとして扱う
      }
    }

    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 },
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 },
    );
  }
}
