class DropAttachmentsTable < ActiveRecord::Migration[7.1]
  def change
    drop_table :attachments, if_exists: true
  end
end
