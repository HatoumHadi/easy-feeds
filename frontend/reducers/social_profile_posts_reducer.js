import { RECEIVE_SOCIAL_PROFILE_POSTS } from '../actions/social_profile_posts_actions';

const socialProfilePostsReducer = (state = {}, action) => {
  switch (action.type) {
    case RECEIVE_SOCIAL_PROFILE_POSTS:
      return {
        ...state,
        [action.profileId]: action.posts
      };
    default:
      return state;
  }
};

export default socialProfilePostsReducer;
