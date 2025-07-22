FactoryBot.define do
  factory :category do
    sequence(:name) { |n| "Category #{n}" }
    color { "#3B82F6" }
    association :user

    trait :work do
      name { "Work" }
      color { "#EF4444" }
    end

    trait :personal do
      name { "Personal" }
      color { "#10B981" }
    end

    trait :urgent do
      name { "Urgent" }
      color { "#F59E0B" }
    end
  end
end
