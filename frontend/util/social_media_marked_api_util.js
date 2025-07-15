// API util for fetching followed social media profiles
export const fetchFollowedSocialProfiles = () => {
  return fetch('/api/social_media_markeds', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
  }).then(res => res.json());
};
