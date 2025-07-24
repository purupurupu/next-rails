# frozen_string_literal: true

FactoryBot.define do
  factory :comment do
    association :user
    content { Faker::Lorem.paragraph(sentence_count: 2) }
    deleted_at { nil }
    
    # 学習ポイント：ポリモーフィック関連のファクトリー
    # デフォルトではtodoに関連付ける
    for_todo # trait
    
    trait :for_todo do
      association :commentable, factory: :todo
    end
    
    trait :deleted do
      deleted_at { 1.hour.ago }
    end
    
    trait :long do
      content { Faker::Lorem.paragraph(sentence_count: 10) }
    end
    
    trait :recent do
      created_at { 1.minute.ago }
    end
    
    trait :old do
      created_at { 1.month.ago }
    end
  end
end
