class ApplicationController < ActionController::API
  # JWT認証に関するメソッドを含む
  include JsonWebTokenAuth
  
  # 認証が必要なアクションの前に実行される
  before_action :authenticate_user!
  
  private
  
  # 現在のユーザーを取得する
  # JWTトークンから認証されたユーザーを取得し、@current_userに設定
  #
  # @return [User, nil] 認証されたユーザーオブジェクト、または nil
  def current_user
    @current_user ||= authenticate_user_from_token
  end
  
  # ユーザーが認証されているかどうかを確認
  #
  # @return [Boolean] 認証済みの場合 true、未認証の場合 false
  def user_signed_in?
    current_user.present?
  end
  
  # 認証必須のアクションで認証チェックを実行
  # 未認証の場合は401エラーを返す
  def authenticate_user!
    return if user_signed_in?
    
    render json: { error: 'Unauthorized' }, status: :unauthorized
  end
  
  # JWTトークンからユーザーを認証する
  #
  # @return [User, nil] 認証されたユーザーオブジェクト、または nil
  def authenticate_user_from_token
    # Authorizationヘッダーからトークンを取得
    token = extract_token_from_header
    return nil unless token
    
    # トークンが有効かどうかを確認
    return nil unless valid_token?(token)
    
    # トークンからユーザーを取得
    user_from_token(token)
  end
  
  # Authorizationヘッダーからトークンを抽出する
  # "Bearer <token>" 形式のヘッダーからトークン部分を取得
  #
  # @return [String, nil] 抽出されたトークン、または nil
  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header
    
    # "Bearer " を削除してトークンのみを取得
    auth_header.split(' ').last if auth_header.start_with?('Bearer ')
  end
end
