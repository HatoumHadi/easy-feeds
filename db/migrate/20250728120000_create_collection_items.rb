class CreateCollectionItems < ActiveRecord::Migration[5.2]
  def change
    create_table :collection_items do |t|
      t.integer :collection_id
      t.integer :item_id
      t.string :item_type
      t.timestamps
    end
  end
end
