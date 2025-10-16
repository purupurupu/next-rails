# frozen_string_literal: true

class McpController < ApplicationController
  # MCP通信用に認証をスキップ
  skip_before_action :authenticate_user!

  def handle
    # MCPサーバーインスタンスを作成
    mcp_server = Mcp::Server.new

    # リクエストボディを処理
    response = mcp_server.handle_request(request.body.read)

    # JSON-RPCレスポンスを返却
    render json: response, status: :ok
  rescue StandardError => e
    # エラーログを記録
    Rails.logger.error("MCP Controller Error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))

    # JSON-RPC エラーレスポンスを返却
    render json: {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: "Internal error: #{e.message}"
      },
      id: nil
    }, status: :internal_server_error
  end
end
