// API util for fetching posts for a social media profile
export const fetchSocialProfilePosts = (profileId) => {
  return fetch(`/api/social_media_profiles/${profileId}/posts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
  }).then(res => res.json());
};
