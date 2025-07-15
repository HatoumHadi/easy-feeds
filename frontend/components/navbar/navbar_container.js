import { connect } from 'react-redux';
import NavBar from './navbar';
import { fetchAllSubscriptions } from '../../actions/subscription_actions';
import { fetchSocialProfiles } from '../../actions/social_profiles_actions';

const mapStateToProps = state => ({
  feeds: state.entities.feeds.byId,
  feedIds: state.session.subscriptions,
  socialProfiles: state.entities.socialProfiles
});

const mapDispatchToProps = dispatch => ({
  fetchAllSubscriptions: () => dispatch(fetchAllSubscriptions()),
  fetchSocialProfiles: () => dispatch(fetchSocialProfiles())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NavBar);
