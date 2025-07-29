# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'TodoSearchService Performance', type: :performance do
  let(:user) { create(:user) }
  
  before do
    # Create a large dataset for performance testing
    categories = create_list(:category, 5, user: user)
    tags = create_list(:tag, 10, user: user)
    
    # Create 1000 todos with various attributes
    1000.times do |i|
      todo = create(:todo,
        user: user,
        title: "Task #{i} #{['urgent', 'important', 'routine'].sample}",
        description: "Description for task #{i} with #{['project', 'meeting', 'review'].sample}",
        status: Todo.statuses.keys.sample,
        priority: Todo.priorities.keys.sample,
        category: categories.sample,
        due_date: rand(-30..30).days.from_now,
        position: i
      )
      
      # Assign random tags
      todo.tags << tags.sample(rand(0..3))
    end
  end

  describe 'search performance' do
    it 'performs text search within acceptable time' do
      time = Benchmark.realtime do
        result = TodoSearchService.new(user, { q: 'urgent' }).call
        result.to_a # Force query execution
      end
      
      expect(time).to be < 0.5 # Should complete within 500ms
    end

    it 'performs complex filtering within acceptable time' do
      time = Benchmark.realtime do
        result = TodoSearchService.new(user, {
          q: 'task',
          status: ['pending', 'in_progress'],
          priority: 'high',
          tag_ids: user.tags.limit(3).pluck(:id),
          due_date_from: Date.today.to_s,
          due_date_to: 1.week.from_now.to_date.to_s,
          sort_by: 'priority',
          sort_order: 'desc'
        }).call
        result.to_a # Force query execution
      end
      
      expect(time).to be < 1.0 # Should complete within 1 second
    end

    it 'benefits from caching on repeated searches' do
      params = { q: 'project', status: 'pending' }
      
      # First search (uncached)
      first_time = Benchmark.realtime do
        TodoSearchService.new(user, params).call.to_a
      end
      
      # Second search (should be cached)
      second_time = Benchmark.realtime do
        TodoSearchService.new(user, params).call.to_a
      end
      
      # Cached search should be significantly faster
      expect(second_time).to be < (first_time * 0.1)
    end

    it 'handles pagination efficiently' do
      time = Benchmark.realtime do
        result = TodoSearchService.new(user, {
          page: 10,
          per_page: 50
        }).call
        result.to_a # Force query execution
      end
      
      expect(time).to be < 0.3 # Pagination should be fast
    end

    it 'avoids N+1 queries' do
      expect {
        result = TodoSearchService.new(user, { q: 'task' }).call
        result.each do |todo|
          # Access associations that should be preloaded
          todo.category&.name
          todo.tags.map(&:name)
          todo.comments.count
          todo.user.email
        end
      }.to perform_under(100).queries # Should use minimal queries
    end
  end

  describe 'database indexes effectiveness' do
    it 'uses indexes for text search' do
      explain = ActiveRecord::Base.connection.execute(
        "EXPLAIN SELECT * FROM todos WHERE LOWER(title) LIKE '%urgent%'"
      ).to_a
      
      # Should use index scan, not sequential scan
      expect(explain.to_s).to include('Index')
    end

    it 'uses composite indexes for user-based queries' do
      explain = ActiveRecord::Base.connection.execute(
        "EXPLAIN SELECT * FROM todos WHERE user_id = #{user.id} AND status = 0"
      ).to_a
      
      # Should use composite index
      expect(explain.to_s).to include('Index')
    end
  end
end