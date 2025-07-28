class CollectionItem < ApplicationRecord
  belongs_to :collection
  belongs_to :profile, optional: true
  belongs_to :website, optional: true

  validates :item_type, presence: true
  validates :item_id, presence: true
end
