require 'rails_helper'

RSpec.describe Todo, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      todo = build(:todo)
      expect(todo).to be_valid
    end

    it 'is not valid without a title' do
      todo = build(:todo, title: nil)
      expect(todo).not_to be_valid
    end

    it 'is not valid with a past due date' do
      todo = build(:todo, due_date: 1.day.ago)
      expect(todo).not_to be_valid
    end
  end

  describe 'factory' do
    it 'creates a valid todo' do
      todo = create(:todo)
      expect(todo).to be_persisted
      expect(todo.title).to be_present
    end
  end
end