# frozen_string_literal: true

# JWT認証サービス
# JWTトークンの生成、検証、デコード機能を提供する
class JwtService
  # JWTトークンの有効期限（24時間）
  EXPIRATION_TIME = 24.hours
  
  # JWTの暗号化アルゴリズム
  ALGORITHM = 'HS256'
  
  class << self
    # JWTトークンを生成する
    #
    # @param payload [Hash] エンコードするデータ（通常はuser_id）
    # @return [String] 生成されたJWTトークン
    #
    # @example
    #   token = JwtService.encode({ user_id: 1 })
    def encode(payload)
      # 有効期限を設定
      payload[:exp] = EXPIRATION_TIME.from_now.to_i
      
      # JWTトークンを生成
      JWT.encode(payload, secret_key, ALGORITHM)
    end
    
    # JWTトークンをデコードする
    #
    # @param token [String] デコードするJWTトークン
    # @return [Hash] デコードされたペイロード
    # @raise [JWT::DecodeError] トークンが無効な場合
    #
    # @example
    #   payload = JwtService.decode(token)
    #   user_id = payload['user_id']
    def decode(token)
      # トークンをデコードし、署名を検証
      decoded_token = JWT.decode(token, secret_key, true, { algorithm: ALGORITHM })
      
      # デコードされたペイロードを返す（配列の最初の要素）
      decoded_token.first
    rescue JWT::DecodeError => e
      # デコードエラーの詳細をログに記録
      Rails.logger.error "JWT decode error: #{e.message}"
      raise
    end
    
    # JWTトークンの有効性を確認する
    #
    # @param token [String] 検証するJWTトークン
    # @return [Boolean] トークンが有効な場合true、無効な場合false
    #
    # @example
    #   if JwtService.valid_token?(token)
    #     # トークンが有効な場合の処理
    #   end
    def valid_token?(token)
      return false if token.blank?
      
      decode(token)
      true
    rescue JWT::DecodeError
      false
    end
    
    # JWTトークンの有効期限を確認する
    #
    # @param token [String] 確認するJWTトークン
    # @return [Boolean] トークンが期限切れの場合true、有効な場合false
    #
    # @example
    #   if JwtService.expired_token?(token)
    #     # トークンが期限切れの場合の処理
    #   end
    def expired_token?(token)
      return true if token.blank?
      
      payload = decode(token)
      
      # 有効期限をチェック
      Time.current.to_i > payload['exp']
    rescue JWT::DecodeError
      # デコードエラーの場合は期限切れとみなす
      true
    end
    
    # トークンからユーザーIDを取得する
    #
    # @param token [String] JWTトークン
    # @return [Integer, nil] ユーザーID（トークンが無効な場合はnil）
    #
    # @example
    #   user_id = JwtService.user_id_from_token(token)
    #   current_user = User.find(user_id) if user_id
    def user_id_from_token(token)
      return nil unless valid_token?(token)
      
      payload = decode(token)
      payload['user_id']
    rescue JWT::DecodeError
      nil
    end
    
    private
    
    # JWT署名用の秘密鍵を取得する
    # Rails.application.credentialsから取得するか、環境変数から取得する
    #
    # @return [String] 秘密鍵
    def secret_key
      # Rails credentialsから秘密鍵を取得
      Rails.application.credentials.secret_key_base || 
      # 環境変数から取得（フォールバック）
      ENV['SECRET_KEY_BASE'] || 
      # デフォルト値（開発環境でのみ使用）
      Rails.application.secret_key_base
    end
  end
end