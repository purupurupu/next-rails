"use client";

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** エラー時に表示するカスタムフォールバックUI */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reactエラーバウンダリコンポーネント
 *
 * 子コンポーネントツリー内で発生したJavaScriptエラーを
 * キャッチし、アプリ全体のクラッシュを防止する。
 * エラー発生時はフォールバックUIを表示し、
 * ユーザーにリカバリー手段を提供する。
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      "[ErrorBoundary] Uncaught error:",
      error,
      errorInfo,
    );
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">
            予期しないエラーが発生しました
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message
              || "アプリケーションでエラーが発生しました。"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={this.handleReset}
            >
              再試行
            </Button>
            <Button
              variant="default"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
