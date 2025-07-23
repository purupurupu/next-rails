class Todo < ApplicationRecord
    # 関連付け（学習ポイント：belongs_to関連）
    belongs_to :user
    belongs_to :category, optional: true, counter_cache: :todos_count
    has_many :todo_tags, dependent: :destroy
    has_many :tags, through: :todo_tags
    
    # Active Storage attachments
    has_many_attached :files do |attachable|
      attachable.variant :thumb, resize_to_limit: [300, 300]
      attachable.variant :medium, resize_to_limit: [800, 800]
    end
    
    # Enums
    enum priority: { low: 0, medium: 1, high: 2 }, _default: :medium
    enum status: { pending: 0, in_progress: 1, completed: 2 }, _default: :pending
    
    validates :title, presence: true
    validates :completed, inclusion: { in: [true, false] }
    validate :due_date_cannot_be_in_the_past, if: -> { due_date.present? }
    validate :validate_file_attachments

    scope :ordered, -> { order(position: :asc) }
    before_create :set_position
    before_destroy :purge_attachments

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

    def validate_file_attachments
      return unless files.attached?
      
      files.each do |file|
        # File size validation (max 10MB)
        if file.byte_size > 10.megabytes
          errors.add(:files, "ファイルサイズは10MB以下にしてください (#{file.filename})")
        end
        
        # File type validation
        allowed_types = %w[
          image/jpeg image/png image/gif image/webp
          application/pdf
          text/plain text/csv
          application/msword application/vnd.openxmlformats-officedocument.wordprocessingml.document
          application/vnd.ms-excel application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        ]
        
        unless allowed_types.include?(file.content_type)
          errors.add(:files, "許可されていないファイルタイプです (#{file.filename}: #{file.content_type})")
        end
      end
    end
    
    def purge_attachments
      files.purge if files.attached?
    end
end
