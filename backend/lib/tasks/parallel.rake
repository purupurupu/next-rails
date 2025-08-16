namespace :parallel do
  desc "Setup test databases for parallel tests"
  task :setup => :environment do
    system("RAILS_ENV=test bundle exec parallel_test -e 'bundle exec rails db:drop db:create db:migrate'")
  end
  
  desc "Run RSpec tests in parallel"
  task :spec => :environment do
    ENV['COVERAGE'] = 'true' if ENV['CI'] || ENV['COVERAGE']
    system("bundle exec parallel_rspec spec/")
  end
  
  desc "Run RSpec tests in parallel with detailed output"
  task :spec_verbose => :environment do
    ENV['COVERAGE'] = 'true' if ENV['CI'] || ENV['COVERAGE']
    system("bundle exec parallel_rspec spec/ --verbose")
  end
  
  desc "Run specific RSpec test file in parallel"
  task :spec_single => :environment do
    if ENV['SPEC']
      ENV['COVERAGE'] = 'true' if ENV['CI'] || ENV['COVERAGE']
      system("bundle exec parallel_rspec #{ENV['SPEC']}")
    else
      puts "Please specify a test file: rake parallel:spec_single SPEC=spec/models/todo_spec.rb"
    end
  end
  
  desc "Generate coverage report after parallel tests"
  task :coverage => :environment do
    require 'simplecov'
    SimpleCov.collate Dir["coverage/.resultset*.json"] do
      formatter SimpleCov::Formatter::MultiFormatter.new([
        SimpleCov::Formatter::HTMLFormatter,
        SimpleCov::Formatter::JSONFormatter
      ])
    end
  end
  
  desc "Run parallel tests with coverage report"
  task :spec_with_coverage => [:spec, :coverage]
end

desc "Run tests in parallel (alias for parallel:spec)"
task :parallel => "parallel:spec"