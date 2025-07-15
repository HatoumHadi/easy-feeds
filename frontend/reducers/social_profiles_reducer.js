// Reducer for social media profiles
const socialProfilesReducer = (state = [], action) => {
  switch (action.type) {
    case 'RECEIVE_SOCIAL_PROFILES':
      return action.socialProfiles;
    default:
      return state;
  }
};

export default socialProfilesReducer;
