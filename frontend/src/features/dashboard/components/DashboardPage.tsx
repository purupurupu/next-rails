"use client";

import { memo } from "react";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { StatCard } from "./StatCard";
import { WeeklyChart } from "./WeeklyChart";
import { CategoryProgress } from "./CategoryProgress";
import type { DashboardStats } from "../types/dashboard";

/** Props for DashboardPage component */
interface DashboardPageProps {
  initialStats: DashboardStats | null;
}

/**
 * Main dashboard client component
 *
 * Receives SSR data as initialStats and uses SWR
 * for client-side revalidation via fallbackData pattern.
 */
export function DashboardPage({
  initialStats,
}: DashboardPageProps) {
  const { stats, isLoading, error } = useDashboardStats({
    fallbackData: initialStats ?? undefined,
  });

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">
          データの取得に失敗しました
        </p>
      </div>
    );
  }

  if (isLoading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 rounded-lg"
            />
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">データがありません</p>
      </div>
    );
  }

  const { completion_stats, status_breakdown } = stats;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        ダッシュボード
      </h1>

      {/* Completion stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="今日の完了"
          value={completion_stats.today}
          accentColor="bg-green-500"
        />
        <StatCard
          label="今週の完了"
          value={completion_stats.this_week}
          accentColor="bg-blue-500"
        />
        <StatCard
          label="今月の完了"
          value={completion_stats.this_month}
          accentColor="bg-purple-500"
        />
        <StatCard
          label="全体の完了率"
          value={
            completion_stats.total > 0
              ? Math.round(
                  completion_stats.total_completed
                  / completion_stats.total * 100,
                )
              : 0
          }
          subtitle={
            `${completion_stats.total_completed}`
            + `/${completion_stats.total} 完了`
          }
          accentColor="bg-amber-500"
        />
      </div>

      {/* Status and Priority breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="bg-white rounded-lg border border-gray-200 p-5"
        >
          <h3
            className="text-sm font-medium text-gray-500 mb-3"
          >
            ステータス別
          </h3>
          <div className="space-y-2">
            <StatusRow
              label="未着手"
              count={status_breakdown.pending}
              color="bg-gray-400"
              total={completion_stats.total}
            />
            <StatusRow
              label="進行中"
              count={status_breakdown.in_progress}
              color="bg-blue-500"
              total={completion_stats.total}
            />
            <StatusRow
              label="完了"
              count={status_breakdown.completed}
              color="bg-green-500"
              total={completion_stats.total}
            />
          </div>
        </div>
        <div
          className="bg-white rounded-lg border border-gray-200 p-5"
        >
          <h3
            className="text-sm font-medium text-gray-500 mb-3"
          >
            優先度別
          </h3>
          <div className="space-y-2">
            <StatusRow
              label="高"
              count={stats.priority_breakdown.high}
              color="bg-red-500"
              total={completion_stats.total}
            />
            <StatusRow
              label="中"
              count={stats.priority_breakdown.medium}
              color="bg-amber-500"
              total={completion_stats.total}
            />
            <StatusRow
              label="低"
              count={stats.priority_breakdown.low}
              color="bg-gray-400"
              total={completion_stats.total}
            />
          </div>
        </div>
      </div>

      {/* Weekly trend chart */}
      <WeeklyChart data={stats.weekly_trend} />

      {/* Category progress */}
      <CategoryProgress
        categories={stats.category_progress}
      />
    </div>
  );
}

/** Internal memoized component for status/priority rows */
const StatusRow = memo(function StatusRow({
  label,
  count,
  color,
  total,
}: {
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  const pct = total > 0
    ? Math.round((count / total) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
        aria-hidden="true"
      />
      <span className="text-sm text-gray-700 w-16">
        {label}
      </span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-gray-500 w-16 text-right">
        {count}
        {" "}
        (
        {pct}
        %)
      </span>
    </div>
  );
});
