class Todo < ApplicationRecord
  belongs_to :user
  belongs_to :category, optional: true, counter_cache: :todos_count
  has_many :todo_tags, dependent: :destroy
  has_many :tags, through: :todo_tags
  has_many :comments, as: :commentable, dependent: :destroy
  has_many :todo_histories, dependent: :destroy

  has_many_attached :files do |attachable|
    attachable.variant :thumb, resize_to_limit: [300, 300]
    attachable.variant :medium, resize_to_limit: [800, 800]
  end

  enum :priority, { low: 0, medium: 1, high: 2 }, default: :medium
  enum :status, { pending: 0, in_progress: 1, completed: 2 }, default: :pending

  validates :title, presence: true
  validates :completed, inclusion: { in: [true, false] }
  validate :due_date_cannot_be_in_the_past, if: -> { due_date.present? }
  validate :validate_file_attachments

  scope :ordered, -> { order(position: :asc) }

  before_create :set_position
  after_create :record_creation
  around_update :track_changes
  after_destroy :invalidate_category_cache
  after_save :invalidate_category_cache_if_changed

  private

  def set_position
    last_position = user.todos.maximum(:position) || 0
    self.position = last_position + 1
  end

  def due_date_cannot_be_in_the_past
    return unless due_date.present? && due_date < Date.current

    errors.add(:due_date, 'は過去の日付にできません')
  end

  def validate_file_attachments
    return unless files.attached?

    files.each do |file|
      validate_file_size(file)
      validate_file_type(file)
    end
  end

  def validate_file_size(file)
    return unless file.byte_size > 10.megabytes

    errors.add(:files, "ファイルサイズは10MB以下にしてください (#{file.filename})")
  end

  def validate_file_type(file)
    allowed_types = %w[
      image/jpeg image/png image/gif image/webp
      application/pdf
      text/plain text/csv
      application/msword application/vnd.openxmlformats-officedocument.wordprocessingml.document
      application/vnd.ms-excel application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
    ]

    return if allowed_types.include?(file.content_type)

    errors.add(:files, "許可されていないファイルタイプです (#{file.filename}: #{file.content_type})")
  end

  def record_creation
    TodoChangeTrackerService.new(todo: self).record_creation
  end

  def track_changes(&)
    TodoChangeTrackerService.new(todo: self).track_update(&)
  end

  def invalidate_category_cache_if_changed
    return unless saved_change_to_category_id?

    invalidate_category_cache
  end

  def invalidate_category_cache
    Rails.cache.delete("user_#{user_id}_categories")
  end
end
