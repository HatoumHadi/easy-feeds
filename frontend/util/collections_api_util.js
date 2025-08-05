// Remove an item (feed or social profile) from a collection
export const removeCollectionItem = async (collectionId, itemType, itemId) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const res = await fetch(`/api/collections/${collectionId}/remove_item`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
    },
    body: JSON.stringify({
      item_type: itemType,
      item_id: itemId
    })
  });
  if (!res.ok) throw new Error('Failed to remove item from collection');
  return res.json();
};
// API utility for fetching collections

// Fetch all collections (basic)
export const fetchCollections = async () => {
  const res = await fetch('/api/collections', {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch collections');
  return res.json();
};

// Fetch collections with their feed items (requires backend endpoint)
export const fetchCollectionsWithFeedsAndSocialMediaProfiles = async () => {
  const res = await fetch('/api/collections/with_feeds_and_social_media_profiles', {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Failed to fetch collections with feeds');
  return res.json();
};

// Add an item (feed or social profile) to a collection
export const addCollectionItem = async (collectionId, itemType, itemId) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const res = await fetch(`/api/collections/${collectionId}/add_items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
    },
    body: JSON.stringify({
      item_type: itemType,
      item_id: itemId
    })
  });
  if (!res.ok) throw new Error('Failed to add item to collection');
  return res.json();
};
