import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker/本番デプロイ用のスタンドアロン出力
  output: "standalone",

  // 画像最適化設定
  images: {
    // 開発環境のバックエンドからの画像を許可
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/rails/active_storage/**",
      },
    ],
  },

  // TypeScript型チェックをビルド時にスキップ（CIで別途実行）
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLintをビルド時にスキップ（CIで別途実行）
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
