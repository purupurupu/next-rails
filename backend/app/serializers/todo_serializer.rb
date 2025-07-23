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
      result = {
        id: file.id,
        filename: file.filename.to_s,
        content_type: file.content_type,
        byte_size: file.byte_size,
        url: Rails.application.routes.url_helpers.rails_blob_url(file, host: 'localhost:3001')
      }
      
      # TODO: Add variant URLs for images when Active Storage variants are properly configured
      # if file.content_type.start_with?('image/')
      #   result[:variants] = {
      #     thumb: Rails.application.routes.url_helpers.rails_representation_url(
      #       file.variant(:thumb).processed, 
      #       host: 'localhost:3001'
      #     ),
      #     medium: Rails.application.routes.url_helpers.rails_representation_url(
      #       file.variant(:medium).processed,
      #       host: 'localhost:3001'
      #     )
      #   }
      # end
      
      result
    end
  end
end