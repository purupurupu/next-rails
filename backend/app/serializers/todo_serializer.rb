class TodoSerializer < ActiveModel::Serializer
  attributes :id, :title, :completed, :position, :due_date, :priority, :status, :description, :user_id, :created_at, :updated_at, :category, :tags, :files

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

  def files
    return [] unless object.files.attached?
    
    object.files.map do |file|
      {
        id: file.id,
        filename: file.filename.to_s,
        content_type: file.content_type,
        byte_size: file.byte_size,
        url: Rails.application.routes.url_helpers.rails_blob_url(file, host: 'localhost:3001')
      }
    end
  end
end