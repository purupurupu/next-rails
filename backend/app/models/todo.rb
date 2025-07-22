class Todo < ApplicationRecord
    # 関連付け（学習ポイント：belongs_to関連）
    belongs_to :user
    belongs_to :category, optional: true
    
    # Enums
    enum priority: { low: 0, medium: 1, high: 2 }, _default: :medium
    enum status: { pending: 0, in_progress: 1, completed: 2 }, _default: :pending
    
    validates :title, presence: true
    validates :completed, inclusion: { in: [true, false] }
    validate :due_date_cannot_be_in_the_past, if: -> { due_date.present? }

    scope :ordered, -> { order(position: :asc) }
    before_create :set_position

    private

    def set_position
      last_position = user.todos.maximum(:position) || 0
      self.position = last_position + 1
    end

    def due_date_cannot_be_in_the_past
      if due_date.present? && due_date < Date.current
        errors.add(:due_date, "は過去の日付にできません")
      end
    end
end
