import { cache } from "react";
import { serverGet } from "@/lib/server/api-client";
import type { DashboardStats } from "../types/dashboard";

/** API response wrapper from Rails */
interface ApiResponse<T> {
  data: T;
  status: { code: number; message: string };
}

/**
 * Fetch dashboard stats on the server side
 * Uses React.cache() for request-level deduplication
 */
const getCachedDashboardStats = cache(async () => {
  return serverGet<ApiResponse<DashboardStats>>(
    "/api/v1/dashboard/stats",
  );
});

/**
 * Fetch dashboard stats for SSR
 * Returns null on failure so the page can still render
 */
export async function fetchDashboardData():
Promise<DashboardStats | null> {
  try {
    const result = await getCachedDashboardStats();
    return result?.data ?? null;
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return null;
  }
}
