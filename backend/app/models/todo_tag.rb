class TodoTag < ApplicationRecord
  belongs_to :todo
  belongs_to :tag

  validates :todo_id, uniqueness: { scope: :tag_id }

  after_create :invalidate_tags_cache
  after_destroy :invalidate_tags_cache

  private

  def invalidate_tags_cache
    user_id = todo&.user_id
    Rails.cache.delete("user_#{user_id}_tags") if user_id
  end
end
