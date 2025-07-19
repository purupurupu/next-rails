FactoryBot.define do
  factory :todo do
    association :user
    title { Faker::Lorem.sentence(word_count: 3) }
    completed { false }
    due_date { Faker::Date.forward(days: 30) }
    priority { :medium }
    status { :pending }
    description { Faker::Lorem.paragraph(sentence_count: 2) }
    
    trait :completed do
      completed { true }
      status { :completed }
    end
    
    trait :overdue do
      due_date { Faker::Date.backward(days: 5) }
    end
    
    trait :no_due_date do
      due_date { nil }
    end

    trait :high_priority do
      priority { :high }
    end

    trait :low_priority do
      priority { :low }
    end

    trait :in_progress do
      status { :in_progress }
    end

    trait :no_description do
      description { nil }
    end
  end
end