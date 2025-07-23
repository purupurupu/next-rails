FactoryBot.define do
  factory :todo_tag do
    association :todo
    association :tag

    # Ensure todo and tag belong to the same user
    after(:build) do |todo_tag|
      if todo_tag.todo && todo_tag.tag && todo_tag.todo.user != todo_tag.tag.user
        todo_tag.tag = create(:tag, user: todo_tag.todo.user)
      end
    end
  end
end
