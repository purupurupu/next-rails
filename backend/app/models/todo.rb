class Todo < ApplicationRecord
    validates :title, presence: true
    validates :completed, inclusion: { in: [true, false] }
    validate :due_date_cannot_be_in_the_past, if: -> { due_date.present? }

    default_scope { order(position: :asc) }
    before_create :set_position

    private

    def set_position
      last_position = Todo.maximum(:position) || 0
      self.position = last_position + 1
    end

    def due_date_cannot_be_in_the_past
      if due_date.present? && due_date < Date.current
        errors.add(:due_date, "は過去の日付にできません")
      end
    end
end
