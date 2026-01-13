class TodoFileService
  attr_reader :todo

  def initialize(todo:)
    @todo = todo
  end

  def attach(files)
    return ServiceResult.success(data: todo) if files.blank?

    todo.files.attach(files)
    ServiceResult.success(data: todo)
  end

  def destroy(file_id)
    file = todo.files.find(file_id)
    file.purge
    ServiceResult.success(data: todo)
  rescue ActiveRecord::RecordNotFound
    ServiceResult.failure(error: 'File not found')
  end
end
