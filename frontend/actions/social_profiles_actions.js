import { fetchFollowedSocialProfiles } from '../util/social_media_marked_api_util';

export const RECEIVE_SOCIAL_PROFILES = 'RECEIVE_SOCIAL_PROFILES';

export const receiveSocialProfiles = (socialProfiles) => ({
  type: RECEIVE_SOCIAL_PROFILES,
  socialProfiles,
});

export const fetchSocialProfiles = () => dispatch => {
  return fetchFollowedSocialProfiles().then(markeds => {
    // Extract the social_media_profile from each marked
    const profiles = markeds.map(marked => marked.social_media_profile);
    dispatch(receiveSocialProfiles(profiles));
  });
};
