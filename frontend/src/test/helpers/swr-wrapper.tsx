import type { ReactNode } from "react";
import { SWRConfig } from "swr";

/**
 * テスト用SWRラッパー
 * dedupingInterval を0にし、テスト間でキャッシュを分離する
 */
export function createSWRWrapper() {
  function SWRTestWrapper({ children }: { children: ReactNode }) {
    return (
      <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map() }}>
        {children}
      </SWRConfig>
    );
  }
  return SWRTestWrapper;
}
