import { fetchSocialProfilePosts as apiFetchSocialProfilePosts } from '../util/social_media_marked_api_util';

export const RECEIVE_SOCIAL_PROFILE_POSTS = 'RECEIVE_SOCIAL_PROFILE_POSTS';

export const receiveSocialProfilePosts = (profileId, posts) => ({
  type: RECEIVE_SOCIAL_PROFILE_POSTS,
  profileId,
  posts,
});

export const fetchSocialProfilePosts = (profileId) => dispatch => {
  return apiFetchSocialProfilePosts(profileId).then(posts => {
    dispatch(receiveSocialProfilePosts(profileId, posts));
  });
};
