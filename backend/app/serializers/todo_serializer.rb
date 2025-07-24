class TodoSerializer < ActiveModel::Serializer
  attributes :id, :title, :completed, :position, :due_date, :priority, :status, :description, :user_id, :created_at, :updated_at, :category, :tags, :files, :comments_count, :latest_comments, :history_count

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
  
  # 学習ポイント：コメント数を効率的に取得
  def comments_count
    # N+1クエリを避けるため、counter_cacheを使用することも検討
    object.comments.count
  end
  
  # 学習ポイント：最新のコメントを3件まで取得
  def latest_comments
    # 最新の3件のコメントを取得してシリアライズ
    comments = object.comments
                     .includes(:user)
                     .recent
                     .limit(3)
    
    ActiveModelSerializers::SerializableResource.new(
      comments,
      each_serializer: CommentSerializer,
      current_user: current_user
    ).as_json
  end
  
  def current_user
    @instance_options[:current_user] || scope
  end
  
  # 学習ポイント：履歴数の取得
  def history_count
    object.todo_histories.count
  end
end