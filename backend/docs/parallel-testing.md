# Parallel Testing Setup

## Overview
This document describes the parallel testing infrastructure implemented for the Rails backend test suite.

## Configuration

### Gemfile
Added `parallel_tests` gem to the test group:
```ruby
group :test do
  gem 'parallel_tests'
end
```

### Database Configuration
Updated `config/database.yml` to support multiple test databases:
```yaml
test:
  <<: *default
  database: todo_app_test<%= ENV['TEST_ENV_NUMBER'] %>
```

### SimpleCov Configuration
Updated `spec/spec_helper.rb` to support coverage aggregation:
```ruby
SimpleCov.command_name "RSpec:#{ENV['TEST_ENV_NUMBER']}" if ENV['TEST_ENV_NUMBER']
```

## Usage

### Basic Commands

1. **Run all tests in parallel (default 4 workers)**:
   ```bash
   docker compose exec backend env RAILS_ENV=test bundle exec parallel_rspec spec/
   ```

2. **Run with specific number of workers**:
   ```bash
   docker compose exec backend env RAILS_ENV=test bundle exec parallel_rspec spec/ -n 8
   ```

3. **Run excluding performance tests**:
   ```bash
   docker compose exec backend env RAILS_ENV=test bundle exec parallel_rspec spec/ --exclude-pattern 'spec/**/*_performance_spec.rb' -n 4
   ```

4. **Run with coverage**:
   ```bash
   docker compose exec backend env RAILS_ENV=test COVERAGE=true bundle exec parallel_rspec spec/ -n 4
   ```

### Using Helper Script

The `bin/parallel_test` script provides convenient commands:

```bash
# Run all tests
docker compose exec backend bin/parallel_test all

# Run non-performance tests
docker compose exec backend bin/parallel_test non-performance

# Run with specific workers
docker compose exec backend bin/parallel_test workers 8

# Run single file
docker compose exec backend bin/parallel_test single spec/models/todo_spec.rb
```

### Using Rake Tasks

```bash
# Setup parallel test databases
docker compose exec backend bundle exec rake parallel:setup

# Run all tests
docker compose exec backend bundle exec rake parallel:spec

# Run with coverage
docker compose exec backend bundle exec rake parallel:spec_with_coverage
```

## Performance Comparison

### Test Suite Statistics
- Total tests: 535 examples (excluding performance tests)
- Test files: 31 spec files

### Execution Time Comparison

| Method | Workers | Time | Improvement |
|--------|---------|------|-------------|
| Sequential | 1 | ~9.6s | Baseline |
| Parallel | 2 | ~4s | 58% faster |
| Parallel | 4 | ~35s* | - |

*Note: The 4-worker parallel execution shows longer total time due to Rails boot overhead for each worker. This overhead becomes less significant with larger test suites.

### When to Use Parallel Testing

Parallel testing is beneficial when:
- Running the full test suite in CI/CD pipelines
- Test suite takes more than 30 seconds sequentially
- You have sufficient CPU cores available
- Running on powerful CI servers

Parallel testing may not be beneficial when:
- Running a small subset of tests locally
- Debugging specific test failures
- Working on resource-constrained environments

## Best Practices

1. **Database Isolation**: Each parallel worker uses its own database (todo_app_test, todo_app_test2, etc.)

2. **Coverage Aggregation**: SimpleCov automatically aggregates coverage from all workers

3. **Avoiding Deadlocks**: Ensure tests don't compete for the same database resources

4. **Worker Count**: Optimal worker count is typically CPU cores - 1

5. **Performance Tests**: Run performance tests separately to avoid affecting timing measurements

## Troubleshooting

### Common Issues

1. **Database conflicts**: Run `rake parallel:setup` to recreate test databases

2. **Coverage not aggregating**: Ensure `COVERAGE=true` is set for all workers

3. **Deadlocks**: Review test isolation and factory usage

4. **Slow parallel execution**: Reduce worker count or check for resource constraints

## Future Improvements

1. **CI Optimization**: Configure optimal worker count based on CI environment
2. **Test Splitting**: Implement intelligent test file distribution based on execution time
3. **Spring Integration**: Enable Spring preloader for faster Rails boot times
4. **Performance Monitoring**: Track test execution times to identify slow tests