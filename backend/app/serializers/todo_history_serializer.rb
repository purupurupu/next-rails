# frozen_string_literal: true

# 学習ポイント：履歴データのシリアライズ
class TodoHistorySerializer < ActiveModel::Serializer
  attributes :id, :field_name, :old_value, :new_value, :action,
             :created_at, :human_readable_change

  # 学習ポイント：関連ユーザー情報の含める
  belongs_to :user

  # 学習ポイント：可読性の高い変更内容を含める
  delegate :human_readable_change, to: :object
end
