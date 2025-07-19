class Todo < ApplicationRecord
    # 関連付け（学習ポイント：belongs_to関連）
    belongs_to :user
    
    # Enums
    enum priority: { low: 0, medium: 1, high: 2 }
    enum status: { pending: 0, in_progress: 1, completed: 2 }
    
    validates :title, presence: true
    validates :completed, inclusion: { in: [true, false] }
    validates :priority, presence: true
    validates :status, presence: true
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
