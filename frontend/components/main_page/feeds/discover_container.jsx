import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { fetchFeedResults } from '../../../actions/discovery_actions';
import { deleteFeed } from '../../../actions/subscription_actions';
import {createFeedOnly, removeFeedFromAllCollections} from '../../../actions/feed_actions'
import { openPopOut } from '../../../actions/popout_actions';
import { clearErrors } from '../../../actions/errors_actions';
import { fetchUnsubscribedFeed } from '../../../actions/story_actions';
import { addCollectionItemAction } from '../../../actions/collection_actions';
import { subscribeExistingFeed } from '../../../actions/subscription_actions';
import Discover from './discover';

const mapStateToProps = state => ({
  feeds: state.entities.feeds,
  errors: state.errors.feeds,
  loadingMessages: state.loading.messages
});

const mapDispatchToProps = dispatch => ({
  fetchFeedResults: query => dispatch(fetchFeedResults(query)),
  createFeedOnly: feed => dispatch(createFeedOnly(feed)),
  addCollectionItemAction: (colId, itemType, itemId) => dispatch(addCollectionItemAction(colId, itemType, itemId)),
  subscribeExistingFeed: (feedId) => dispatch(subscribeExistingFeed(feedId)),
  openPopOut: component => dispatch(openPopOut(component)),
  fetchUnsubscribedFeed: feedId => dispatch(fetchUnsubscribedFeed(feedId)),
  clearErrors: () => dispatch(clearErrors()),
  deleteFeed: feed => dispatch(deleteFeed(feed)),
  removeFeedFromAllCollections: feedId => dispatch(removeFeedFromAllCollections(feedId)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Discover);
