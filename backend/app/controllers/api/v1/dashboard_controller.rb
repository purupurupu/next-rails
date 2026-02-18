# frozen_string_literal: true

module Api
  module V1
    # Dashboard statistics endpoint
    # Returns aggregated productivity data for the current user
    class DashboardController < BaseController
      def stats
        service = DashboardStatsService.new(user: current_user)
        render_json_response(data: service.call)
      end
    end
  end
end
