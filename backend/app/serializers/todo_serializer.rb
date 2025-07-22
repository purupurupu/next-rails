class TodoSerializer < ActiveModel::Serializer
  attributes :id, :title, :completed, :position, :due_date, :priority, :status, :description, :created_at, :updated_at
  
  belongs_to :category, serializer: CategorySerializer

  def category
    return nil unless object.category
    {
      id: object.category.id,
      name: object.category.name,
      color: object.category.color
    }
  end
end