import useSWR from "swr";
import {
  fetchDashboardStats,
  DASHBOARD_STATS_KEY,
} from "../lib/api-client";
import { defaultSWRConfig } from "@/lib/swr-config";
import type { DashboardStats } from "../types/dashboard";

/** Options for useDashboardStats hook */
interface UseDashboardStatsOptions {
  fallbackData?: DashboardStats;
}

/**
 * SWR hook for fetching dashboard statistics
 *
 * Accepts optional fallbackData from SSR to avoid
 * a loading flash on initial render.
 */
export function useDashboardStats(
  options: UseDashboardStatsOptions = {},
) {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    DASHBOARD_STATS_KEY,
    fetchDashboardStats,
    {
      ...defaultSWRConfig,
      fallbackData: options.fallbackData,
      revalidateIfStale: false,
      revalidateOnMount: false,
    },
  );

  return {
    stats: data,
    error,
    isLoading,
    refresh: mutate,
  };
}
