import { combineReducers } from 'redux';
import FeedsReducer from './feeds_reducer';
import StoriesReducer from './stories_reducer';
import SocialProfilesReducer from './social_profiles_reducer';

export default combineReducers({
  feeds: FeedsReducer,
  stories: StoriesReducer,
  socialProfiles: SocialProfilesReducer
});
