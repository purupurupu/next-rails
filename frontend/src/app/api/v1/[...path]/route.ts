import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_CONFIG } from "@/lib/auth/config";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * 汎用BFFプロキシ
 * /api/v1/* へのリクエストをRails APIに転送
 */
async function proxyRequest(
  request: NextRequest,
  method: string,
): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_CONFIG.TOKEN_COOKIE_NAME)?.value;

    // パスを取得（/api/v1/todos → /api/v1/todos）
    const url = new URL(request.url);
    const path = url.pathname; // /api/v1/todos など
    const queryString = url.search; // ?sort_by=position など

    const backendUrl = `${BACKEND_URL}${path}${queryString}`;

    // ヘッダーを構築
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Content-Type の処理
    const contentType = request.headers.get("content-type");

    let body: BodyInit | null = null;

    if (method !== "GET" && method !== "HEAD") {
      if (contentType?.includes("multipart/form-data")) {
        // ファイルアップロード: FormDataをそのまま転送
        body = await request.formData();
      } else if (contentType?.includes("application/json")) {
        // JSON: そのまま転送
        headers["Content-Type"] = "application/json";
        body = await request.text();
      } else if (contentType) {
        // その他のContent-Type
        headers["Content-Type"] = contentType;
        body = await request.text();
      }
    }

    // Rails APIにリクエスト
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });

    // レスポンスヘッダーを転送
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // 一部のヘッダーは転送しない
      if (
        !["transfer-encoding", "connection", "keep-alive"].includes(
          key.toLowerCase(),
        )
      ) {
        responseHeaders.set(key, value);
      }
    });

    // レスポンスボディを取得
    const responseContentType = response.headers.get("content-type");

    if (responseContentType?.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, {
        status: response.status,
        headers: responseHeaders,
      });
    } else {
      // バイナリ（ファイルダウンロードなど）
      const blob = await response.blob();
      return new NextResponse(blob, {
        status: response.status,
        headers: responseHeaders,
      });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "プロキシエラーが発生しました" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request, "PUT");
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, "PATCH");
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, "DELETE");
}
