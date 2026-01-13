class TodoTagService
  attr_reader :todo, :user, :tag_ids

  def initialize(todo:, user:, tag_ids:)
    @todo = todo
    @user = user
    @tag_ids = normalize_tag_ids(tag_ids)
  end

  def call
    return clear_tags if tag_ids.empty?

    valid_tag_ids = user.tags.where(id: tag_ids).pluck(:id)
    invalid_tag_ids = tag_ids - valid_tag_ids

    if invalid_tag_ids.any?
      ServiceResult.failure(
        error: 'Invalid tag IDs',
        details: { invalid_tags: invalid_tag_ids }
      )
    else
      todo.tag_ids = valid_tag_ids
      ServiceResult.success(data: todo)
    end
  end

  def assign_valid_tags
    valid_tag_ids = user.tags.where(id: tag_ids).pluck(:id)
    todo.tag_ids = valid_tag_ids
  end

  private

  def normalize_tag_ids(ids)
    return [] if ids.nil?

    Array(ids).map(&:to_i)
  end

  def clear_tags
    todo.tag_ids = []
    ServiceResult.success(data: todo)
  end
end
