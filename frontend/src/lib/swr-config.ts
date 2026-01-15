import type { SWRConfiguration } from "swr";

/**
 * SWR共通設定
 *
 * - dedupingInterval: 重複リクエストの抑制時間
 * - revalidateOnFocus: タブフォーカス時の再検証
 * - revalidateOnReconnect: ネットワーク復帰時の再検証
 */
export const defaultSWRConfig: SWRConfiguration = {
  dedupingInterval: 60000, // 1分間の重複排除
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

/**
 * 短いキャッシュ用の設定（頻繁に更新されるデータ向け）
 */
export const shortCacheSWRConfig: SWRConfiguration = {
  dedupingInterval: 10000, // 10秒間の重複排除
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

/**
 * 長いキャッシュ用の設定（めったに変更されないデータ向け）
 */
export const longCacheSWRConfig: SWRConfiguration = {
  dedupingInterval: 300000, // 5分間の重複排除
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};
