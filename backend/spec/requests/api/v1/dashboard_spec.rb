# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Dashboard', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user) }
  let(:auth_headers) { auth_headers_for(user) }

  describe 'GET /api/v1/dashboard/stats' do
    context 'without authentication' do
      it 'returns 401' do
        get '/api/v1/dashboard/stats'

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with no todos' do
      it 'returns empty stats' do
        get '/api/v1/dashboard/stats', headers: auth_headers

        expect(response).to have_http_status(:ok)
        json = response.parsed_body
        data = json['data']

        expect(data['completion_stats']['total']).to eq(0)
        expect(data['completion_stats']['total_completed']).to eq(0)
        expect(data['priority_breakdown']).to eq(
          'low' => 0, 'medium' => 0, 'high' => 0
        )
        expect(data['status_breakdown']).to eq(
          'pending' => 0, 'in_progress' => 0, 'completed' => 0
        )
        expect(data['category_progress']).to eq([])
        expect(data['weekly_trend'].length).to eq(7)
      end
    end

    context 'with todos' do
      let!(:category) { create(:category, user: user, name: 'Work', color: '#EF4444') }

      before do
        create(:todo, user: user, completed: true, status: :completed,
                      priority: :high, category: category,
                      updated_at: Time.current)
        create(:todo, user: user, completed: true, status: :completed,
                      priority: :medium,
                      updated_at: Time.current)
        create(:todo, user: user, completed: false, status: :pending,
                      priority: :low, category: category)
        create(:todo, user: user, completed: false, status: :in_progress,
                      priority: :high)
      end

      it 'returns completion stats' do
        get '/api/v1/dashboard/stats', headers: auth_headers

        json = response.parsed_body
        stats = json['data']['completion_stats']

        expect(stats['total']).to eq(4)
        expect(stats['total_completed']).to eq(2)
        expect(stats['today']).to eq(2)
      end

      it 'returns priority breakdown' do
        get '/api/v1/dashboard/stats', headers: auth_headers

        json = response.parsed_body
        breakdown = json['data']['priority_breakdown']

        expect(breakdown['high']).to eq(2)
        expect(breakdown['medium']).to eq(1)
        expect(breakdown['low']).to eq(1)
      end

      it 'returns status breakdown' do
        get '/api/v1/dashboard/stats', headers: auth_headers

        json = response.parsed_body
        breakdown = json['data']['status_breakdown']

        expect(breakdown['pending']).to eq(1)
        expect(breakdown['in_progress']).to eq(1)
        expect(breakdown['completed']).to eq(2)
      end

      it 'returns category progress' do
        get '/api/v1/dashboard/stats', headers: auth_headers

        json = response.parsed_body
        progress = json['data']['category_progress']

        work_cat = progress.find { |c| c['name'] == 'Work' }
        expect(work_cat).to be_present
        expect(work_cat['total']).to eq(2)
        expect(work_cat['completed']).to eq(1)
        expect(work_cat['progress']).to eq(50.0)
      end
    end

    context 'with weekly trend data' do
      before do
        todo = create(:todo, user: user)
        create(:todo_history, :completed,
               todo: todo, user: user,
               created_at: 2.days.ago)
        create(:todo_history, :completed,
               todo: todo, user: user,
               created_at: 1.day.ago)
        create(:todo_history, :completed,
               todo: todo, user: user,
               created_at: Time.current)
      end

      it 'returns daily completion counts for the past 7 days' do
        get '/api/v1/dashboard/stats', headers: auth_headers

        json = response.parsed_body
        trend = json['data']['weekly_trend']

        expect(trend.length).to eq(7)
        expect(trend.last['date']).to eq(Date.current.iso8601)
      end
    end

    context 'data isolation between users' do
      before do
        create(:todo, user: user, completed: true, status: :completed)
        create(:todo, user: other_user, completed: true, status: :completed)
      end

      it 'only returns data for the current user' do
        get '/api/v1/dashboard/stats', headers: auth_headers

        json = response.parsed_body
        expect(json['data']['completion_stats']['total']).to eq(1)
      end
    end
  end
end
