"use client";

import { parseISO, format } from "date-fns";
import { ja } from "date-fns/locale";
import type { DailyCompletion } from "../types/dashboard";

/** Props for WeeklyChart component */
interface WeeklyChartProps {
  data: DailyCompletion[];
}

/**
 * Simple SVG bar chart showing daily completions
 * for the past 7 days. No external chart library required.
 */
export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const chartHeight = 160;
  const barWidth = 36;
  const gap = 12;
  const chartWidth = data.length * (barWidth + gap) - gap;

  const formatDay = (dateStr: string) => {
    return format(parseISO(dateStr), "E", { locale: ja });
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), "M/d");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        週間完了トレンド
      </h3>
      <div className="overflow-x-auto">
        <svg
          width={chartWidth + 20}
          height={chartHeight + 50}
          viewBox={
            `0 0 ${chartWidth + 20} ${chartHeight + 50}`
          }
          className="mx-auto"
          role="img"
          aria-label="週間完了トレンドのバーチャート"
        >
          {data.map((item, i) => {
            const barHeight = maxCount > 0
              ? (item.count / maxCount) * chartHeight
              : 0;
            const x = 10 + i * (barWidth + gap);
            const y = chartHeight - barHeight;

            return (
              <g key={item.date}>
                {/* Bar background */}
                <rect
                  x={x}
                  y={0}
                  width={barWidth}
                  height={chartHeight}
                  rx={4}
                  fill="#F3F4F6"
                />
                {/* Bar value */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill="#3B82F6"
                  className="transition-all duration-300"
                />
                {/* Count label */}
                {item.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    textAnchor="middle"
                    className="fill-gray-700 text-xs font-medium"
                    fontSize="12"
                  >
                    {item.count}
                  </text>
                )}
                {/* Day label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className="fill-gray-500"
                  fontSize="11"
                >
                  {formatDay(item.date)}
                </text>
                {/* Date label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 32}
                  textAnchor="middle"
                  className="fill-gray-400"
                  fontSize="10"
                >
                  {formatDate(item.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
