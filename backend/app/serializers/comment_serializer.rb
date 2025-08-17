# frozen_string_literal: true

# 学習ポイント：ActiveModel::Serializerを使用したレスポンスのカスタマイズ
class CommentSerializer < ActiveModel::Serializer
  attributes :id, :content, :created_at, :updated_at, :editable

  # 学習ポイント：関連モデルの情報も含める
  belongs_to :user

  # 学習ポイント：カスタム属性の追加
  # 現在のユーザーがコメントを編集できるかどうかを返す
  def editable
    # current_userはコントローラーから渡される
    return false unless current_user

    object.editable? && object.owned_by?(current_user)
  end

  # 学習ポイント：シリアライザーコンテキストへのアクセス
  def current_user
    # コントローラーから渡されるcurrent_userを取得
    @instance_options[:current_user] || scope
  end
end
