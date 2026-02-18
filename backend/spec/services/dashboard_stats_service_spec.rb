# frozen_string_literal: true

require 'rails_helper'

RSpec.describe DashboardStatsService do
  subject(:service) { described_class.new(user: user) }

  let(:user) { create(:user) }

  describe '#call' do
    it 'returns all expected keys' do
      result = service.call

      expect(result).to have_key(:completion_stats)
      expect(result).to have_key(:priority_breakdown)
      expect(result).to have_key(:status_breakdown)
      expect(result).to have_key(:category_progress)
      expect(result).to have_key(:weekly_trend)
    end
  end

  describe 'completion_stats' do
    context 'with completed todos at different times' do
      before do
        create(:todo, user: user, completed: true, status: :completed,
                      updated_at: Time.current)
        create(:todo, user: user, completed: true, status: :completed,
                      updated_at: 3.days.ago)
        create(:todo, user: user, completed: false, status: :pending)
      end

      it 'counts today completions' do
        stats = service.call[:completion_stats]
        expect(stats[:today]).to eq(1)
      end

      it 'counts week completions' do
        stats = service.call[:completion_stats]
        expect(stats[:this_week]).to be >= 1
      end

      it 'counts month completions' do
        stats = service.call[:completion_stats]
        expect(stats[:this_month]).to be >= 1
      end

      it 'counts total and total_completed' do
        stats = service.call[:completion_stats]
        expect(stats[:total]).to eq(3)
        expect(stats[:total_completed]).to eq(2)
      end
    end
  end

  describe 'priority_breakdown' do
    before do
      create(:todo, user: user, priority: :low)
      create(:todo, user: user, priority: :low)
      create(:todo, user: user, priority: :high)
    end

    it 'groups todos by priority' do
      breakdown = service.call[:priority_breakdown]
      expect(breakdown[:low]).to eq(2)
      expect(breakdown[:medium]).to eq(0)
      expect(breakdown[:high]).to eq(1)
    end
  end

  describe 'status_breakdown' do
    before do
      create(:todo, user: user, status: :pending)
      create(:todo, user: user, status: :in_progress)
      create(:todo, user: user, status: :in_progress)
      create(:todo, user: user, status: :completed, completed: true)
    end

    it 'groups todos by status' do
      breakdown = service.call[:status_breakdown]
      expect(breakdown[:pending]).to eq(1)
      expect(breakdown[:in_progress]).to eq(2)
      expect(breakdown[:completed]).to eq(1)
    end
  end

  describe 'category_progress' do
    let!(:category) { create(:category, user: user, name: 'Dev') }

    before do
      create(:todo, user: user, category: category, completed: true)
      create(:todo, user: user, category: category, completed: false)
    end

    it 'returns progress per category' do
      progress = service.call[:category_progress]
      dev = progress.find { |c| c[:name] == 'Dev' }

      expect(dev[:total]).to eq(2)
      expect(dev[:completed]).to eq(1)
      expect(dev[:progress]).to eq(50.0)
    end

    it 'returns 0 progress for empty category' do
      empty_cat = create(:category, user: user, name: 'Empty')

      progress = service.call[:category_progress]
      empty = progress.find { |c| c[:name] == empty_cat.name }

      expect(empty[:total]).to eq(0)
      expect(empty[:progress]).to eq(0.0)
    end
  end

  describe 'weekly_trend' do
    before do
      todo = create(:todo, user: user)
      create(:todo_history, :completed,
             todo: todo, user: user,
             created_at: Date.current.beginning_of_day + 10.hours)
      create(:todo_history, :completed,
             todo: todo, user: user,
             created_at: 1.day.ago.beginning_of_day + 10.hours)
    end

    it 'returns 7 days of data' do
      trend = service.call[:weekly_trend]
      expect(trend.length).to eq(7)
    end

    it 'includes correct dates' do
      trend = service.call[:weekly_trend]
      dates = trend.pluck(:date)

      expect(dates.first).to eq((Date.current - 6.days).iso8601)
      expect(dates.last).to eq(Date.current.iso8601)
    end

    it 'counts completions per day' do
      trend = service.call[:weekly_trend]
      today_data = trend.find { |d| d[:date] == Date.current.iso8601 }
      yesterday_data = trend.find { |d| d[:date] == 1.day.ago.to_date.iso8601 }

      expect(today_data[:count]).to eq(1)
      expect(yesterday_data[:count]).to eq(1)
    end

    it 'filters by todo owner, not history author' do
      other_user = create(:user)
      other_todo = create(:todo, user: other_user)
      # History authored by our user but on another user's todo
      create(:todo_history, :completed,
             todo: other_todo, user: user,
             created_at: Date.current.beginning_of_day + 10.hours)

      trend = service.call[:weekly_trend]
      today_data = trend.find { |d| d[:date] == Date.current.iso8601 }

      # Should only count the history on user's own todo
      expect(today_data[:count]).to eq(1)
    end
  end
end
