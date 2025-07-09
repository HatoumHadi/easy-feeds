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

      return (
        <StoriesIndexItem key={story.id}
          {...{ story, feed, titleLink }}
          history={this.props.history}
          {...this.state}
          {...this.props}
           />
      );
    }
    );

    // Helper: Facebook search URL
    const fbSearchUrl = `https://www.facebook.com/search/posts/?q=${encodeURIComponent(title)}`;
    // Helper: Instagram search URL (no public search, but hashtag works)
    const instaSearchUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(title.replace(/\s+/g, ''))}/`;

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
          {/* Facebook embed or search preview */}
          <div style={{ marginBottom: 24 }}>
            <strong>Facebook Posts</strong>
            <div style={{ background: '#fff', borderRadius: 6, minHeight: 120, padding: 10, marginTop: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              {/* Facebook public search embed (iframe) is not officially supported, so we provide a styled link */}
              <a
                href={fbSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#1877f2', gap: 12 }}
              >
                <img src="https://static.xx.fbcdn.net/rsrc.php/yo/r/iRmz9lCMBD2.ico" alt="Facebook" style={{ width: 32, height: 32, borderRadius: 4 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>See Facebook posts about "{title}"</div>
                  <div style={{ color: '#888', fontSize: 13 }}>Click to view public posts, images, and discussions on Facebook</div>
                </div>
              </a>
            </div>
          </div>
          {/* Instagram embed or search preview */}
          <div>
            <strong>Instagram Posts</strong>
            <div style={{ background: '#fff', borderRadius: 6, minHeight: 120, padding: 10, marginTop: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              {/* Instagram hashtag search preview (no public API, so link to hashtag page) */}
              <a
                href={instaSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#e1306c', gap: 12 }}
              >
                <img src="https://instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png" alt="Instagram" style={{ width: 32, height: 32, borderRadius: 4 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>See Instagram posts for #{title.replace(/\s+/g, '')}</div>
                  <div style={{ color: '#888', fontSize: 13 }}>Click to view public images and posts on Instagram</div>
                </div>
              </a>
            </div>
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
