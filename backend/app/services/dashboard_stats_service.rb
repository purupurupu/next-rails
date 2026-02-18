# frozen_string_literal: true

# Service to compute dashboard statistics for a user
# Aggregates todo completion data, priority/status breakdowns,
# category progress, and weekly trends
class DashboardStatsService
  attr_reader :user

  def initialize(user:)
    @user = user
  end

  def call
    {
      completion_stats: completion_stats,
      priority_breakdown: priority_breakdown,
      status_breakdown: status_breakdown,
      category_progress: category_progress,
      weekly_trend: weekly_trend
    }
  end

  private

  def todos
    @todos ||= user.todos
  end

  # Single query using CASE WHEN to count completions
  # for today, this week, and this month simultaneously
  def completion_stats
    today = Date.current
    bow = today.beginning_of_week
    bom = today.beginning_of_month

    row = todos.where(completed: true).pick(
      Arel.sql(sanitize_completion_sql(today, bow, bom))
    )

    today_count, week_count, month_count, total_completed =
      row || [0, 0, 0, 0]

    {
      today: today_count,
      this_week: week_count,
      this_month: month_count,
      total: todos.count,
      total_completed: total_completed
    }
  end

  def priority_breakdown
    counts = todos.group(:priority).count
    normalize_enum_counts(counts, %w[low medium high])
  end

  def status_breakdown
    counts = todos.group(:status).count
    normalize_enum_counts(counts, %w[pending in_progress completed])
  end

  # Uses GROUP BY aggregate query instead of loading
  # all Todo objects into memory
  def category_progress
    totals = todos.where.not(category_id: nil)
                  .group(:category_id)
                  .count
    completed_counts = todos.where(completed: true)
                            .where.not(category_id: nil)
                            .group(:category_id)
                            .count

    user.categories.map do |category|
      total = totals.fetch(category.id, 0)
      completed = completed_counts.fetch(category.id, 0)
      pct = total.positive? ? (completed.to_f / total * 100).round(1) : 0.0

      {
        id: category.id,
        name: category.name,
        color: category.color,
        total: total,
        completed: completed,
        progress: pct
      }
    end
  end

  # Joins TodoHistory through Todo to filter by
  # todo owner (todos.user_id) rather than change author
  def weekly_trend
    today = Date.current
    start_date = today - 6.days

    completed_by_day = TodoHistory
      .unscope(:order)
      .joins(:todo)
      .where(todos: { user_id: user.id })
      .where(
        field_name: 'completed',
        new_value: 'true'
      )
      .where(
        todo_histories: {
          created_at: start_date.beginning_of_day..today.end_of_day
        }
      )
      .group("DATE(todo_histories.created_at)")
      .count

    (start_date..today).map do |date|
      {
        date: date.iso8601,
        count: completed_by_day.fetch(date, 0)
      }
    end
  end

  # Handles both string keys ('low') and integer keys (0)
  # returned by Rails enum group queries
  def normalize_enum_counts(counts, string_keys)
    result = {}
    string_keys.each_with_index do |key, idx|
      result[key.to_sym] = counts.fetch(key, nil) ||
                            counts.fetch(idx, 0)
    end
    result
  end

  def sanitize_completion_sql(today, bow, bom)
    conn = ActiveRecord::Base.connection
    date_fn = conn.adapter_name.match?(/SQLite/i) ? "DATE(updated_at)" : "updated_at::date"

    ActiveRecord::Base.sanitize_sql_array([
      "COUNT(CASE WHEN #{date_fn} = ? THEN 1 END), " \
        "COUNT(CASE WHEN #{date_fn} >= ? THEN 1 END), " \
        "COUNT(CASE WHEN #{date_fn} >= ? THEN 1 END), " \
        "COUNT(*)",
      today, bow, bom
    ])
  end
end
