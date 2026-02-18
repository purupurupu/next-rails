/** Daily completion data for weekly trend chart */
export interface DailyCompletion {
  date: string;
  count: number;
}

/** Category progress data */
export interface CategoryProgress {
  id: number;
  name: string;
  color: string;
  total: number;
  completed: number;
  progress: number;
}

/** Completion statistics (today, this week, this month) */
export interface CompletionStats {
  today: number;
  this_week: number;
  this_month: number;
  total: number;
  total_completed: number;
}

/** Priority breakdown counts */
export interface PriorityBreakdown {
  low: number;
  medium: number;
  high: number;
}

/** Status breakdown counts */
export interface StatusBreakdown {
  pending: number;
  in_progress: number;
  completed: number;
}

/** Full dashboard stats response */
export interface DashboardStats {
  completion_stats: CompletionStats;
  priority_breakdown: PriorityBreakdown;
  status_breakdown: StatusBreakdown;
  category_progress: CategoryProgress[];
  weekly_trend: DailyCompletion[];
}
