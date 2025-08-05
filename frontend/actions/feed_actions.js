
import * as FeedApiUtil from '../util/feed_api_util';
import { startFeedAction } from './loading_actions';

export const RECEIVE_NEW_FEED = 'RECEIVE_NEW_FEED';
export const RECEIVE_FEED_ERRORS = 'RECEIVE_FEED_ERRORS';

// Remove a feed from all collections (and all folders)
export const removeFeedFromAllCollections = feedId => dispatch => {
  return FeedApiUtil.removeFeedFromAllCollections(feedId)
    .then(
      result => result,
      error => { throw error; }
    );
};

export const receiveNewFeed = feedPayload => ({
  type: RECEIVE_NEW_FEED,
  feeds: feedPayload.feeds,
  stories: feedPayload.stories
});

export const receiveFeedErrors = errors => ({
  type: RECEIVE_FEED_ERRORS,
  errors
});

// Create feed only (no subscription) for following social feeds
export const createFeedOnly = feed => dispatch => {
  dispatch(startFeedAction(["Adding Feed..."]));
  return (
    FeedApiUtil.createFeedOnly(feed)
      .then(
        result => {
          dispatch(receiveNewFeed({
            feeds: { [result.id]: result },
            stories: result.stories || {}
          }));
        },
        errors => dispatch(receiveFeedErrors(errors.responseJSON))
      )
  );
};
