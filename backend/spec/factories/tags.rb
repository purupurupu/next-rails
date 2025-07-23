FactoryBot.define do
  factory :tag do
    sequence(:name) { |n| "tag-#{n}" }
    association :user
    color { "#FF0000" }

    trait :with_todos do
      transient do
        todos_count { 3 }
      end

      after(:create) do |tag, evaluator|
        create_list(:todo_tag, evaluator.todos_count, tag: tag, todo: create(:todo, user: tag.user))
      end
    end

    trait :without_color do
      color { nil }
    end
  end
end
