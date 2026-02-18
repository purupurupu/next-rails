# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ImageVariantJob, type: :job do
  let(:user) { create(:user) }
  let(:todo) { create(:todo, user: user) }

  describe '#perform' do
    context 'with a valid image blob' do
      let(:blob) do
        ActiveStorage::Blob.create_and_upload!(
          io: fixture_file_upload('test_image.png', 'image/png'),
          filename: 'test_image.png',
          content_type: 'image/png'
        )
      end

      before do
        todo.files.attach(blob)
      end

      it 'does not raise an error (gracefully handles missing vips)' do
        expect { described_class.perform_now(blob.id) }.not_to raise_error
      end
    end

    context 'with a non-image blob' do
      let(:blob) do
        ActiveStorage::Blob.create_and_upload!(
          io: StringIO.new('text content'),
          filename: 'document.txt',
          content_type: 'text/plain'
        )
      end

      before do
        todo.files.attach(blob)
      end

      it 'returns early without processing variants' do
        expect { described_class.perform_now(blob.id) }.not_to raise_error
        expect(blob.variant_records.count).to eq(0)
      end
    end

    context 'with a non-existent blob ID' do
      it 'returns early without errors' do
        expect { described_class.perform_now(999_999) }.not_to raise_error
      end
    end

    context 'when blob has no files attachment' do
      let(:blob) do
        ActiveStorage::Blob.create_and_upload!(
          io: fixture_file_upload('test_image.png', 'image/png'),
          filename: 'test_image.png',
          content_type: 'image/png'
        )
      end

      it 'returns early when no files attachment found' do
        expect { described_class.perform_now(blob.id) }.not_to raise_error
      end
    end
  end

  describe 'job enqueuing from TodoFileService' do
    let(:image_file) { fixture_file_upload('test_image.png', 'image/png') }
    let(:text_file) { fixture_file_upload('test_file.txt', 'text/plain') }

    # テスト用にキューアダプタを切り替えてenqueue確認
    around do |example|
      original_adapter = ActiveJob::Base.queue_adapter
      ActiveJob::Base.queue_adapter = :test
      example.run
    ensure
      ActiveJob::Base.queue_adapter = original_adapter
    end

    context 'when attaching image files' do
      it 'enqueues ImageVariantJob for images' do
        service = TodoFileService.new(todo: todo)
        service.attach([image_file])

        expect(described_class).to have_been_enqueued.at_least(:once)
      end
    end

    context 'when attaching non-image files' do
      it 'does not enqueue ImageVariantJob for text files' do
        service = TodoFileService.new(todo: todo)
        service.attach([text_file])

        expect(described_class).not_to have_been_enqueued
      end
    end

    context 'when attaching mixed files' do
      it 'enqueues ImageVariantJob only for image blobs' do
        service = TodoFileService.new(todo: todo)
        service.attach([image_file, text_file])

        # 画像ファイル分だけenqueue される
        expect(described_class).to have_been_enqueued.once
      end
    end
  end
end
