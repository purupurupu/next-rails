namespace :e2e do
  desc "Reset and seed database for E2E tests"
  task reset: :environment do
    unless Rails.env.development? || Rails.env.test?
      abort "This task can only be run in development or test environment"
    end

    Rake::Task["db:schema:load"].invoke
    Rake::Task["db:seed"].invoke
  end
end
