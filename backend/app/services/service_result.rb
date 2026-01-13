class ServiceResult
  attr_reader :success, :data, :error, :details

  def initialize(success:, data: nil, error: nil, details: nil)
    @success = success
    @data = data
    @error = error
    @details = details
  end

  def success?
    success
  end

  def self.success(data: nil)
    new(success: true, data: data)
  end

  def self.failure(error:, details: nil)
    new(success: false, error: error, details: details)
  end
end
