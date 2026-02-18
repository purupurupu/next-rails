"use client";

/** Props for StatCard component */
interface StatCardProps {
  label: string;
  value: number;
  subtitle?: string;
  accentColor?: string;
}

/**
 * A card displaying a single statistic with label and value
 */
export function StatCard({
  label,
  value,
  subtitle,
  accentColor = "bg-blue-500",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`h-3 w-3 rounded-full ${accentColor}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
