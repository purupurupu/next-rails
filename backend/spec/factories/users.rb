FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { 'password123' }
    password_confirmation { 'password123' }
    name { 'Test User' }
    
    trait :with_todos do
      after(:create) do |user|
        create_list(:todo, 3, user: user)
      end
    end
  end
end
