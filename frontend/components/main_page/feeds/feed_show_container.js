import { connect } from 'react-redux';
import FeedShow from './feed_show';

const SOCIAL_PLATFORMS = [
  { key: 'facebook', domain: 'facebook.com' },
  { key: 'twitter', domain: 'twitter.com' },
  { key: 'instagram', domain: 'instagram.com' },
  { key: 'linkedin', domain: 'linkedin.com' },
  { key: 'youtube', domain: 'youtube.com' },
  { key: 'tiktok', domain: 'tiktok.com' },
  { key: 'pinterest', domain: 'pinterest.com' },
  { key: 'threads', domain: 'threads.net' }
];

const groupSocialLinks = (links = []) => {
  const grouped = {};
  SOCIAL_PLATFORMS.forEach(({ key }) => { grouped[key] = []; });
  
  links.forEach(link => {
    try {
      const url = new URL(link);
      const platform = SOCIAL_PLATFORMS.find(p => 
        url.hostname.includes(p.domain)
      );
      if (platform) {
        grouped[platform.key].push(link);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  });
  
  SOCIAL_PLATFORMS.forEach(({ key }) => {
    grouped[key].sort((a, b) => a.length - b.length);
  });
  
  return grouped;
};

const mapStateToProps = (state, ownProps) => {
  const feedId = ownProps.match.params.id;
  const feed = state.entities.feeds.byId[feedId] || {};
  const socialLinks = groupSocialLinks(feed.social_links);
  const websiteLinks = feed.website_links || [];
  return { feed, socialLinks, websiteLinks };
};

export default connect(mapStateToProps)(FeedShow);