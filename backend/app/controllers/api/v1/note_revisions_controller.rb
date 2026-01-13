# frozen_string_literal: true

module Api
  module V1
    class NoteRevisionsController < BaseController
      before_action :set_note

      def index
        revisions = paginate(@note.note_revisions.order(created_at: :desc))

        render_json_response(
          data: revisions,
          each_serializer: NoteRevisionSerializer,
          meta: pagination_meta(revisions),
          message: 'Revisions retrieved successfully'
        )
      end

      def restore
        revision = @note.note_revisions.find(params[:id] || params[:revision_id])
        @note.current_user = current_user

        if @note.update(title: revision.title, body_md: revision.body_md)
          render_json_response(
            data: @note,
            serializer: NoteSerializer,
            message: 'Revision restored successfully'
          )
        else
          render_error_response(
            error: ::ValidationError.new(errors: @note.errors),
            status: :unprocessable_content
          )
        end
      end

      private

      def set_note
        @note = current_user.notes.find(params[:note_id])
      end
    end
  end
end
