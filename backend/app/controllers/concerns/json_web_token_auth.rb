# frozen_string_literal: true

# JWT認証に関するメソッドを提供するモジュール
# ApplicationControllerやその他のコントローラーで使用される
module JsonWebTokenAuth
  extend ActiveSupport::Concern
  
  # このモジュールがincludeされたときに実行される
  included do
    # エラーハンドリングを追加
    rescue_from JWT::DecodeError, with: :handle_decode_error
    rescue_from JWT::ExpiredSignature, with: :handle_expired_token
  end
  
  private
  
  # JWTデコードエラーのハンドリング
  def handle_decode_error(exception)
    Rails.logger.error "JWT Decode Error: #{exception.message}"
    render json: { error: 'Invalid token' }, status: :unauthorized
  end
  
  # JWT有効期限エラーのハンドリング
  def handle_expired_token(exception)
    Rails.logger.error "JWT Expired Token: #{exception.message}"
    render json: { error: 'Token has expired' }, status: :unauthorized
  end
  
  # JWTトークンを生成する
  #
  # @param user [User] トークンを生成するユーザー
  # @return [String] 生成されたJWTトークン
  def generate_token(user)
    ::JwtService.encode({ user_id: user.id })
  end
  
  # JWTトークンを検証する
  #
  # @param token [String] 検証するトークン
  # @return [Boolean] トークンが有効な場合true
  def valid_token?(token)
    ::JwtService.valid_token?(token)
  end
  
  # JWTトークンからユーザーを取得する
  #
  # @param token [String] JWTトークン
  # @return [User, nil] ユーザーオブジェクト、または nil
  def user_from_token(token)
    user_id = ::JwtService.user_id_from_token(token)
    return nil unless user_id
    
    User.find_by(id: user_id)
  end
end