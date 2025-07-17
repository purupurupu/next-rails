FactoryBot.define do
  factory :todo do
    association :user
    title { Faker::Lorem.sentence(word_count: 3) }
    completed { false }
    due_date { Faker::Date.forward(days: 30) }
    
    trait :completed do
      completed { true }
    end
    
    trait :overdue do
      due_date { Faker::Date.backward(days: 5) }
    end
    
    trait :no_due_date do
      due_date { nil }
    end
  end
end