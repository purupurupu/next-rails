import { httpClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/lib/constants";
import type { DashboardStats } from "../types/dashboard";

/**
 * Fetch dashboard statistics for the current user
 */
export async function fetchDashboardStats():
Promise<DashboardStats> {
  return httpClient.get<DashboardStats>(
    API_ENDPOINTS.DASHBOARD_STATS,
  );
}

/**
 * SWR key for dashboard stats
 */
export const DASHBOARD_STATS_KEY = API_ENDPOINTS.DASHBOARD_STATS;
