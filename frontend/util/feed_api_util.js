export const fetchFeedResults = q => (
  $.ajax({
    type: "GET",
    url: "api/feeds",
    data: { q }
  })
);

export const fetchUnsubscribedFeed = feedId => (
  $.ajax({
    type: "GET",
    url: `api/feeds/${feedId}`,
  })
);

export const createFeedOnly = feed => (
  $.ajax({
    type: "POST",
    url: "api/feeds",
    data: { feed }
  })
);

// Remove a feed from all collections
export const removeFeedFromAllCollections = (feedId) => {
  // Get CSRF token from meta tag
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return fetch(`/api/feeds/${feedId}/remove_from_collections`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'X-CSRF-Token': token } : {})
    }
  }).then(res => {
    if (!res.ok) throw new Error('Failed to remove feed from all collections');
    return res.json();
  });
};