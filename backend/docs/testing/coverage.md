# Code Coverage with SimpleCov

This Rails application uses SimpleCov to track code coverage for the test suite.

## Installation

SimpleCov is already configured in the Gemfile. To install dependencies:

```bash
docker compose exec backend bundle install
```

## Running Tests with Coverage

### Method 1: Using Environment Variable

```bash
# Run all tests with coverage
docker compose exec backend env COVERAGE=true RAILS_ENV=test bundle exec rspec

# Run specific test file with coverage
docker compose exec backend env COVERAGE=true RAILS_ENV=test bundle exec rspec spec/models/todo_spec.rb
```

### Method 2: Using Rake Task

```bash
# Run all tests with coverage
docker compose exec backend bundle exec rake coverage

# Or use the full task name
docker compose exec backend bundle exec rake coverage:rspec

# Clean coverage reports
docker compose exec backend bundle exec rake coverage:clean
```

## Viewing Coverage Reports

After running tests with coverage, reports are generated in the `coverage/` directory:

1. **HTML Report**: Open `coverage/index.html` in your browser
2. **JSON Report**: Available at `coverage/coverage.json` for CI integration

### From Host Machine

```bash
# Navigate to backend directory
cd backend

# Open coverage report (macOS)
open coverage/index.html

# Open coverage report (Linux)
xdg-open coverage/index.html
```

## Configuration

SimpleCov is configured in `spec/spec_helper.rb` with:

- **Current Coverage**: ~72% (as of initial setup)
- **Minimum Coverage**: 70% (TODO: increase to 80% after improving test coverage)
- **Excluded Directories**: `/spec/`, `/config/`, `/vendor/`, `/db/`, `/lib/tasks/`
- **Coverage Groups**: Models, Controllers, Serializers, Services, etc.
- **Output Formats**: HTML and JSON

### Current Coverage Status

The application currently has ~72% code coverage. Areas that need improvement include:
- Additional controller action tests
- Service object edge cases
- Error handling paths
- Background job testing

## CI Integration

For CI environments, SimpleCov will automatically run when the `CI` environment variable is set:

```bash
CI=true bundle exec rspec
```

## Coverage Best Practices

1. **Aim for High Coverage**: Target 90%+ coverage for critical code
2. **Focus on Business Logic**: Prioritize coverage for models, services, and controllers
3. **Don't Chase 100%**: Some code (like Rails configurations) doesn't need coverage
4. **Review Uncovered Code**: Use coverage reports to identify untested edge cases
5. **Combine with Other Metrics**: Coverage alone doesn't guarantee quality tests

## Troubleshooting

### Coverage Not Generated

Ensure you're setting the `COVERAGE` environment variable:
```bash
COVERAGE=true bundle exec rspec
```

### Coverage Report Not Found

Check that tests are actually running and the `coverage/` directory exists:
```bash
ls -la coverage/
```

### Low Coverage Warnings

SimpleCov will warn if coverage drops below 80%. To see detailed coverage:
1. Open `coverage/index.html`
2. Click on files with low coverage
3. Red lines indicate uncovered code

## Ignoring Files

To exclude files from coverage, update `spec/spec_helper.rb`:

```ruby
SimpleCov.start 'rails' do
  add_filter '/path/to/exclude/'
  # ... other configuration
end
```