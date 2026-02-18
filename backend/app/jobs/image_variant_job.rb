class ImageVariantJob < ApplicationJob
  queue_as :default

  VARIANTS = {
    thumb: { resize_to_limit: [300, 300] },
    medium: { resize_to_limit: [800, 800] }
  }.freeze

  def perform(blob_id)
    blob = ActiveStorage::Blob.find_by(id: blob_id)
    return unless blob&.image?

    VARIANTS.each_value do |transformations|
      blob.variant(transformations).processed
    end
  rescue ActiveStorage::FileNotFoundError,
         ActiveStorage::InvariableError,
         LoadError => e
    Rails.logger.warn(
      "ImageVariantJob failed for blob #{blob_id}: #{e.message}"
    )
  end
end
