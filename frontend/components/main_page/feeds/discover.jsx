import React from 'react';
import { Link } from 'react-router-dom';
import DiscoverIndexItem from './discover_index_item';
import AddFeedForm from './add_feed_form';

class Discover extends React.Component {
  state = {
    query: "",
    dataBaseSearch: true,
    socialInput: "",
    socialProfile: null,
    socialLoading: false,
    socialError: null
  };

  componentDidMount() {
    window.document.querySelector(".main-content").scrollTo(0,0);
    this.props.fetchFeedResults(this.state.query);
  }

  handleQueryChange = e => {
    this.setState({query: e.target.value});
    this.props.fetchFeedResults(e.target.value);
  }

  handleSwitch = ({ dataBaseSearch, clearErrors }) => {
    this.setState({ dataBaseSearch });
    clearErrors ? this.props.clearErrors() : null;
  }

  // Social media profile input change (only updates input, not fetch)
  handleSocialInputChange = (e) => {
    const value = e.target.value;
    this.setState({ socialInput: value, socialProfile: null, socialError: null });
  };

  // Social media profile fetch logic (triggered by button click)
  handleSocialProfileSearch = async () => {
    const value = this.state.socialInput;
    if (!value || value.length < 2) return;

    // Detect platform and username
    let platform = null, username = null, url = null;
    const trimmed = value.trim();
    // Instagram
    if (/instagram\.com\//i.test(trimmed)) {
      platform = "Instagram";
      username = trimmed.split("instagram.com/")[1].split(/[/?#]/)[0];
      url = `https://www.instagram.com/${username}/`;
    } else if (/twitter\.com\//i.test(trimmed)) {
      platform = "X";
      username = trimmed.split("twitter.com/")[1].split(/[/?#]/)[0];
      url = `https://twitter.com/${username}`;
    } else if (/youtube\.com\//i.test(trimmed)) {
      platform = "YouTube";
      if (/\/channel\//.test(trimmed)) {
        username = trimmed.split("/channel/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/channel/${username}`;
      } else if (/\/user\//.test(trimmed)) {
        username = trimmed.split("/user/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/user/${username}`;
      } else if (/\/c\//.test(trimmed)) {
        username = trimmed.split("/c/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/c/${username}`;
      }
    } else if (/facebook\.com\//i.test(trimmed)) {
      platform = "Facebook";
      username = trimmed.split("facebook.com/")[1].split(/[/?#]/)[0];
      url = `https://facebook.com/${username}`;
    } else if (trimmed.startsWith('@')) {
      // If user enters @username, try all platforms (prefer X, then Instagram)
      username = trimmed.slice(1);
      platform = "X";
      url = `https://twitter.com/${username}`;
    } else if (/^\w+$/.test(trimmed)) {
      // If user enters just a username, try all platforms (prefer X, then Instagram)
      username = trimmed;
      platform = "X";
      url = `https://twitter.com/${username}`;
    }

    // If the user entered a full URL, always use that for unavatar fallback
    let inputUrl = null;
    try {
      inputUrl = new URL(trimmed);
    } catch (e) {}
    // YouTube
    if (!platform && /youtube\.com\//i.test(trimmed)) {
      platform = "YouTube";
      if (/\/channel\//.test(trimmed)) {
        username = trimmed.split("/channel/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/channel/${username}`;
      } else if (/\/user\//.test(trimmed)) {
        username = trimmed.split("/user/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/user/${username}`;
      } else if (/\/c\//.test(trimmed)) {
        username = trimmed.split("/c/")[1].split(/[/?#]/)[0];
        url = `https://www.youtube.com/c/${username}`;
      }
    }
    // Facebook (profile or page)
    if (!platform && /facebook\.com\//i.test(trimmed)) {
      platform = "Facebook";
      username = trimmed.split("facebook.com/")[1].split(/[/?#]/)[0];
      url = `https://facebook.com/${username}`;
    }

    if (!platform || !username) {
      this.setState({ socialProfile: null, socialError: null });
      return;
    }

    this.setState({ socialLoading: true, socialProfile: null, socialError: null });

    // Fetch profile info (oEmbed or public endpoints)
    try {
      let profile = { platform, username, url };
      // Use unavatar.io with platform/username for best reliability
      if (platform === "Instagram") {
        profile.avatar = `https://unavatar.io/instagram/${username}`;
        // Only use fallback with platform/username, not full URL for Instagram
        profile.avatarFallback = inputUrl ? `https://unavatar.io/${inputUrl.origin + inputUrl.pathname}` : `https://unavatar.io/${url}`;
        profile.bio = null;
        profile.followers = null;
      } else if (platform === "X") {
        profile.avatar = `https://unavatar.io/twitter/${username}`;
        profile.avatarFallback = inputUrl ? `https://unavatar.io/${inputUrl.origin + inputUrl.pathname}` : `https://unavatar.io/${url}`;
        profile.bio = null;
        profile.followers = null;
      } else if (platform === "YouTube") {
        profile.avatar = `https://unavatar.io/youtube/${username}`;
        profile.avatarFallback = inputUrl ? `https://unavatar.io/${inputUrl.origin + inputUrl.pathname}` : `https://unavatar.io/${url}`;
        profile.bio = null;
        profile.followers = null;
      } else if (platform === "Facebook") {
        profile.avatar = `https://unavatar.io/facebook/${username}`;
        profile.avatarFallback = inputUrl ? `https://unavatar.io/${inputUrl.origin + inputUrl.pathname}` : `https://unavatar.io/${url}`;
        profile.bio = null;
        profile.followers = null;
      }
      this.setState({ socialProfile: profile, socialLoading: false, socialError: null });
    } catch (err) {
      this.setState({ socialProfile: null, socialLoading: false, socialError: "Could not fetch profile info." });
    }
  };

  render() {
    const text = this.state.query.length === 0 ? "Popular Feeds" : "Results";
    const { dataBaseSearch, socialInput, socialProfile, socialLoading, socialError } = this.state;

    let section = null;
    if (dataBaseSearch) {
      section = <DataBaseSearch handleQueryChange={this.handleQueryChange} {...this.state} />;
    } else if (!dataBaseSearch && !this.state.socialSection) {
      section = <AddFeedForm {...this.props} />;
    } else if (this.state.socialSection) {
      section = (
        <div style={{ marginTop: 24 }}>
          <h1>Find Social Media Profile</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, maxWidth: 420 }}>
            <i className="fa fa-user-circle" style={{ fontSize: 22, color: '#1976d2' }} aria-hidden="true"></i>
            <input
              type="text"
              value={socialInput}
              onChange={this.handleSocialInputChange}
              placeholder="Enter @username or profile URL (Instagram, X, YouTube, Facebook)"
              style={{ flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 16 }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); this.handleSocialProfileSearch(); } }}
            />
            <button
              onClick={this.handleSocialProfileSearch}
              style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#219653', color: '#fff', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginLeft: 4 }}
              disabled={socialLoading || !socialInput || socialInput.length < 2}
            >
              Search
            </button>
          </div>
          {socialLoading && <div style={{ color: '#888', fontSize: 14, margin: '12px 0' }}>Loading...</div>}
          {socialError && <div style={{ color: '#d32f2f', fontSize: 14, margin: '12px 0' }}>{socialError}</div>}
          {socialProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '12px 0', background: '#f8f9fa', borderRadius: 8, padding: 14 }}>
              <img
                src={socialProfile.avatar}
                alt="avatar"
                style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #eee', background: '#fff', objectFit: 'cover' }}
                onError={async e => {
                  // Try to fetch the real image directly from the platform as a last resort
                  if (socialProfile.avatarFallback && !e.target._triedFallback) {
                    e.target._triedFallback = true;
                    e.target.src = socialProfile.avatarFallback;
                  } else if (socialProfile.platform === 'Facebook' && !e.target._triedDirect) {
                    e.target._triedDirect = true;
                    // Try Facebook graph API for public pages
                    const fbUrl = `https://graph.facebook.com/${socialProfile.username}/picture?type=large`;
                    e.target.src = fbUrl;
                  } else if (socialProfile.platform === 'Instagram' && !e.target._triedDirect) {
                    e.target._triedDirect = true;
                    // Try to get Instagram profile image via unavatar.io backend proxy (best chance for CORS)
                    const unavatarProxy = `https://unavatar.io/instagram/${socialProfile.username}`;
                    const testImg = new window.Image();
                    testImg.onload = function() { e.target.src = unavatarProxy; };
                    testImg.onerror = function() {
                      // Fallback to initials if all else fails
                      e.target.onerror = null;
                      e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(socialProfile.username || 'User') + '&background=eee&color=555&size=56';
                    };
                    testImg.src = unavatarProxy;
                  } else {
                    e.target.onerror = null;
                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(socialProfile.username || 'User') + '&background=eee&color=555&size=56';
                  }
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{socialProfile.platform}</div>
                <div style={{ color: '#333', fontSize: 16, margin: '2px 0' }}>@{socialProfile.username}</div>
                {socialProfile.bio && <div style={{ color: '#666', fontSize: 14 }}>{socialProfile.bio}</div>}
                {socialProfile.followers && <div style={{ color: '#888', fontSize: 13 }}>Followers: {socialProfile.followers}</div>}
                <a href={socialProfile.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', fontWeight: 500, fontSize: 15, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>View Profile</a>
              </div>
            </div>
          )}
        </div>
      );
    }

    return(
      <div className="discover-search-index">
        <DiscoverFormSwitch
          handleSwitch={sectionType => {
            if (sectionType.dataBaseSearch !== undefined) {
              this.setState({ dataBaseSearch: sectionType.dataBaseSearch, socialSection: false });
            } else if (sectionType.socialSection) {
              this.setState({ dataBaseSearch: false, socialSection: true });
            }
            if (sectionType.clearErrors) this.props.clearErrors();
          }}
          dataBaseSearch={dataBaseSearch}
          socialSection={this.state.socialSection}
        />

        {section}

        <div className="discover-items">
          <h2>{text}</h2>
          <DiscoverIndexItems {...this.props} />
        </div>
      </div>
    );
  }
}

function DiscoverFormSwitch({ handleSwitch, dataBaseSearch, socialSection }) {
  return (
    <div className="discover-form-switch" style={{ display: 'flex', alignItems: 'flex-end', gap: 0, borderBottom: '1px solid #e0e0e0', marginBottom: 24 }}>
      <div className={`discover-search-button no-select ${dataBaseSearch && !socialSection ? "selected" : ""}`}
        onClick={e => handleSwitch({dataBaseSearch: true, clearErrors: true})}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px 8px 0', fontSize: 18, color: dataBaseSearch && !socialSection ? '#219653' : '#888', fontWeight: dataBaseSearch && !socialSection ? 600 : 400, borderBottom: dataBaseSearch && !socialSection ? '3px solid #219653' : '3px solid transparent', cursor: 'pointer', background: 'none', boxShadow: 'none', outline: 'none', transition: 'color 0.2s, border-bottom 0.2s'
        }}
      >
        <i className="fa fa-rss" aria-hidden="true"></i>
        <span>Search</span>
      </div>
      <div className={`discover-add-url-button no-select ${!dataBaseSearch && !socialSection ? "selected" : ""}`}
        onClick={e => handleSwitch({dataBaseSearch: false, socialSection: false})}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px 8px 0', fontSize: 18, color: !dataBaseSearch && !socialSection ? '#219653' : '#888', fontWeight: !dataBaseSearch && !socialSection ? 600 : 400, borderBottom: !dataBaseSearch && !socialSection ? '3px solid #219653' : '3px solid transparent', cursor: 'pointer', background: 'none', boxShadow: 'none', outline: 'none', transition: 'color 0.2s, border-bottom 0.2s'
        }}
      >
        <i className="fa fa-link" aria-hidden="true"></i>
        <span>Add URL</span>
      </div>
      <div className={`discover-social-profile-tab no-select ${socialSection ? "selected" : ""}`}
        onClick={e => handleSwitch({socialSection: true})}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px 8px 0', fontSize: 18, color: socialSection ? '#219653' : '#888', fontWeight: socialSection ? 600 : 400, borderBottom: socialSection ? '3px solid #219653' : '3px solid transparent', cursor: 'pointer', background: 'none', boxShadow: 'none', outline: 'none', transition: 'color 0.2s, border-bottom 0.2s'
        }}
      >
        <i className="fa fa-user-circle" aria-hidden="true"></i>
        <span>Social Profile</span>
      </div>
    </div>
  );
}

function DataBaseSearch({ query, handleQueryChange }) {
  return (
    <div>
      <h1>What sources do you want to follow?</h1>
      <form>
        <div className="feed-search-input-container">
          <input className="feed-search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search for a feed..."
            />
          <i className="fa fa-search" aria-hidden="true"></i>
        </div>
      </form>
    </div>
  );
}

function DiscoverIndexItems({ feeds, ...feedActions }) {
  const results = feeds.results.length === 0 ?
    ["No Feeds Found"] :
    feeds.results.map(resultId =>
      <DiscoverIndexItem key={resultId} feed={feeds.byId[resultId]} {...feedActions} />
    );

  return (
    <div className="results">
      {results}
    </div>
  );
}

export default Discover;
