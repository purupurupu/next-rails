# Override DATABASE_URL for test environment to ensure test database is used
if Rails.env.test?
  ENV['DATABASE_URL'] = 'postgres://postgres:password@db:5432/todo_app_test'
end