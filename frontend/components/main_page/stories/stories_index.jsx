import React from 'react';
import StoriesIndexItem from './stories_index_item';
import throttle from 'lodash-es/throttle';

class StoriesIndex extends React.Component {
  state = {
    condensedView: window.innerWidth <= 810
  };

  componentDidMount() {
    document.querySelector(".main-content").scrollTo(0,0);
    document.querySelector(".main-content").addEventListener('scroll', this.throttledScroll, false);
    addEventListener('resize', this.throttledResize, false)
    if (this.props.stories.length === 0 || this.props.readView) {
      this.props.fetchAction(this.props.match.params.id);
    }
    this.storyIndex = document.querySelector(".story-index");
  }

  componentWillUnmount() {
    let timeout = null;
    document.querySelector(".main-content").removeEventListener('scroll', this.throttledScroll, false);
    removeEventListener('resize', this.throttledResize, false);
  }

  throttledResize = throttle(e => this.onResize(e), 300);

  onResize = e => {
    if (this.storyIndex.offsetWidth < 500 && !this.state.condensedView) {
      this.setState({condensedView: true})
    } else if (this.storyIndex.offsetWidth > 500 && this.state.condensedView) {
      this.setState({condensedView: false})
    }
  }

  throttledScroll = throttle(e => this.onScroll(e), 300);

  onScroll = (e) => {
    if (this.props.readView || this.props.previewView) { return; }

    if ((e.target.scrollHeight - e.target.scrollTop
          <= e.target.offsetHeight + 300) &&
        this.props.stories.length &&
        this.props.moreStories
      ) {
        this.fetchMoreStories(this.props.stories.length);
      }
  }

  componentWillReceiveProps(newProps) {
    const oldURL = this.props.match.url;
    const newURL = newProps.match.url;
    if (newProps.stories.length === 0 && oldURL !== newURL) {
      newProps.fetchAction(newProps.match.params.id);
    } else if (oldURL !== newURL) {
      window.document.querySelector(".main-content").scrollTo(0,0);
    }
  }

  fetchMoreStories(offset) {
    this.props.fetchAction(this.props.match.params.id, offset);
  }

  render() {
    const { stories, feeds, title, titleLink,
            moreStories, previewView, readView } = this.props;

    const storyItems = stories.map(story => {
      const feed = feeds[story.feed_id];
      // Generate social links for each story
      const storyTitle = story.title || title;
      const fbStoryUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(storyTitle)}`;
      const instaStoryUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(storyTitle.replace(/\s+/g, ''))}/`;

      return (
        <StoriesIndexItem
          key={story.id}
          {...{ story, feed, titleLink }}
          history={this.props.history}
          facebookLink={fbStoryUrl}
          instagramLink={instaStoryUrl}
          {...this.state}
          {...this.props}
        />
      );
    });

    // Helper: Facebook search URL
    const fbSearchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(title)}`;
    // Helper: Instagram search URL (no public search, but hashtag works)
    const instaSearchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(title.replace(/\s+/g, ''))}/`;

    // Error UI: show if there is a feed error (simulate with this.props.feedError or similar)
    const { feedError } = this.props;
    if (feedError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{
            background: '#fff3f3',
            border: '1px solid #ffb3b3',
            borderRadius: 12,
            padding: '40px 32px',
            maxWidth: 480,
            boxShadow: '0 2px 8px rgba(255,0,0,0.07)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }}>⛔</div>
            <h2 style={{ color: '#d32f2f', marginBottom: 12 }}>Feed Not Found</h2>
            <div style={{ color: '#b71c1c', fontSize: 17, marginBottom: 18 }}>
              We couldn't find an RSS feed at this URL.<br />
              Try a direct feed URL or contact support if you believe this is an error.
            </div>
            <button
              style={{
                background: '#ff4d4f',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                marginTop: 8
              }}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Main stories section */}
        <div className="story-index" style={{ flex: 2 }}>
          <StoriesIndexHeader {...{titleLink}}>{title}</StoriesIndexHeader>
          {storyItems}
          {moreStories && !previewView && !readView ?
            <div>Loading...</div> :
            null}
        </div>
        {/* Social media content section */}
        <div className="social-media-panel" style={{ flex: 1, minWidth: 320, background: '#f8f9fa', borderRadius: 8, padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.07)' }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>Related Social Media</h3>
          {/* List all social media links for all stories */}
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {stories.map((story, idx) => {
              const storyTitle = story.title || title;
              const fbStoryUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(storyTitle)}`;
              const instaStoryUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(storyTitle.replace(/\s+/g, ''))}/`;
              const twitterUrl = `https://twitter.com/search?q=${encodeURIComponent(storyTitle)}&src=typed_query`;
              const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(storyTitle)}`;
              return (
                <div key={story.id || idx} style={{ marginBottom: 28, background: '#fff', borderRadius: 8, padding: 14, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{story.title}</div>
                  <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>{story.teaser ? story.teaser.slice(0, 100) + (story.teaser.length > 100 ? '...' : '') : ''}</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <a
                      href={fbStoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#1877f2', gap: 6, fontWeight: 500 }}
                    >
                      <img src="https://cdn.simpleicons.org/facebook/1877f2" alt="Facebook" style={{ width: 20, height: 20 }} />
                      Facebook
                    </a>
                    <a
                      href={instaStoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#e1306c', gap: 6, fontWeight: 500 }}
                    >
                      <img src="https://instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png" alt="Instagram" style={{ width: 20, height: 20 }} />
                      Instagram
                    </a>
                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#000', gap: 6, fontWeight: 500 }}
                    >
                      <img src="https://cdn.simpleicons.org/x/000000" alt="X" style={{ width: 20, height: 20 }} />
                      X
                    </a>
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#ff0000', gap: 6, fontWeight: 500 }}
                    >
                      <img src="https://cdn.simpleicons.org/youtube/ff0000" alt="YouTube" style={{ width: 20, height: 20 }} />
                      YouTube
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  static defaultProps = {
    stories: [],
    title: "",
    titleLink: null
  };
}

const StoriesIndexHeader = ({titleLink, title, children}) => (
  <div>
    <h2>
      {titleLink ?
        <a href={titleLink} target="__blank">{children}</a>
        : children}
    </h2>
  </div>
);

export default StoriesIndex;
