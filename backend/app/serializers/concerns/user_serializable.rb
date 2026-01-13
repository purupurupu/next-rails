module UserSerializable
  extend ActiveSupport::Concern

  included do
    attribute :user do |object|
      UserSerializer.new(object.user).serializable_hash[:data][:attributes]
    end
  end
end
