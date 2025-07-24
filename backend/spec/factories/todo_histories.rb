# frozen_string_literal: true

FactoryBot.define do
  factory :todo_history do
    association :todo
    association :user
    field_name { 'title' }
    old_value { 'Old Title' }
    new_value { 'New Title' }
    action { 'updated' }
    
    trait :created do
      field_name { 'created' }
      old_value { nil }
      new_value { 'New Todo' }
      action { 'created' }
    end
    
    trait :status_changed do
      field_name { 'status' }
      old_value { 'pending' }
      new_value { 'in_progress' }
      action { 'status_changed' }
    end
    
    trait :priority_changed do
      field_name { 'priority' }
      old_value { 'low' }
      new_value { 'high' }
      action { 'priority_changed' }
    end
    
    trait :completed do
      field_name { 'completed' }
      old_value { 'false' }
      new_value { 'true' }
      action { 'updated' }
    end
  end
end
