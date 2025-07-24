class TodoSerializer < ActiveModel::Serializer
  attributes :id, :title, :completed, :position, :due_date, :priority, :status, :description, :user_id, :created_at, :updated_at, :category, :tags, :attachments

  def category
    return nil unless object.category
    {
      id: object.category.id,
      name: object.category.name,
      color: object.category.color
    }
  end

  def tags
    object.tags.map do |tag|
      {
        id: tag.id,
        name: tag.name,
        color: tag.color
      }
    end
  end

  def attachments
    object.attachments.map do |attachment|
      {
        id: attachment.id,
        filename: attachment.filename,
        file_size: attachment.file_size,
        file_type: attachment.file_type,
        human_file_size: attachment.human_file_size,
        url: attachment.file_url,
        created_at: attachment.created_at.iso8601
      }
    end
  end
end