class CategorySerializer < ActiveModel::Serializer
  attributes :id, :name, :color, :todo_count, :created_at, :updated_at

  def todo_count
    object.todos_count
  end
end