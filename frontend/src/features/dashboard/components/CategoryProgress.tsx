"use client";

import type {
  CategoryProgress as CategoryProgressData,
} from "../types/dashboard";

/** Props for CategoryProgress component */
interface CategoryProgressProps {
  categories: CategoryProgressData[];
}

/**
 * Displays progress bars for each category
 * showing completion rate with color coding
 */
export function CategoryProgress({
  categories,
}: CategoryProgressProps) {
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-4">
          カテゴリ別進捗
        </h3>
        <p className="text-sm text-gray-400">
          カテゴリがありません
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-medium text-gray-500 mb-4">
        カテゴリ別進捗
      </h3>
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-gray-700">
                  {cat.name}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {cat.completed}
                /
                {cat.total}
                (
                {cat.progress}
                %)
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-gray-100"
              role="progressbar"
              aria-valuenow={cat.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                `${cat.name}: ${cat.progress}% 完了`
              }
            >
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${cat.progress}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
