import React from 'react';
import { Link } from 'react-router-dom';

class NavBar extends React.Component {
  getSelectedLink = () => {
    const location = this.props.location.pathname.split("/")[2]
    return location === "subscriptions" ?
    this.props.location.pathname.split("/")[3] : location;
  }

  state = {
    isOpen: true,
    selected: this.getSelectedLink(),
    isManuallyClosed: false,
    isManuallyOpen: false,
    selectedSocialProfile: null // Track selected social profile
  };

  componentDidMount() {
    this.handleResize();
    addEventListener('resize', this.handleResize, false);
    this.props.fetchAllSubscriptions();
    if (this.props.fetchSocialProfiles) {
      this.props.fetchSocialProfiles();
    }
  }

  handleResize = () => {
    if (window.innerWidth < 700 && !this.state.isManuallyOpen) {
      this.setState({isOpen: false})
    } else if (!this.state.isManuallyClosed) {
      this.setState({isOpen: true})
    }

    if (window.innerWidth > 700) {
      this.setState({isManuallyOpen: false});
    }
  }

  componentWillUnmount() {
    removeEventListener('resize', this.handleResize, false);
  }

  handleClick = (e) => {
    let controlState = {};
    if (e.target.className.includes("fa-compress")) {
      controlState = {isManuallyClosed: true, isManuallyOpen: false};
    } else {
      controlState = {isManuallyOpen: true, isManuallyClosed: false};
    }

    this.setState(({ isOpen }) => ({isOpen: !isOpen, ...controlState}));
  }

  handleSelectedUpdate = () => {
    setTimeout(() => this.setState({selected: this.getSelectedLink()}), 0);
  }

  closeNavBar = () => {
    if (window.innerWidth < 700) {
      this.setState({isOpen: false})
    };
  }

  handleSocialProfileClick = (profile) => {
    this.setState({ selectedSocialProfile: profile });
  }

  handleBackToFeeds = () => {
    this.setState({ selectedSocialProfile: null });
  }

  render() {
    const { isOpen, selected, selectedSocialProfile } = this.state;
    const { feedIds, feeds, socialProfiles } = this.props;

    return (
      <>
        <section onClick={this.handleSelectedUpdate}
          className={`navbar ${isOpen ? "" : "collapsed"}`}
        >
          <NavBarMenu {...this.state}
            handleClick={this.handleClick}
            closeNavBar={this.closeNavBar}
          />
          { isOpen ?
            <div>
              <NavBarLinks
                {...{feedIds, selected, feeds, socialProfiles}}
                closeNavBar={this.closeNavBar}
                onSocialProfileClick={this.handleSocialProfileClick}
              />
              <NavBarAddContent closeNavBar={this.closeNavBar}/>
            </div>
            : null
          }
        </section>
        <main className="main-content">
          {selectedSocialProfile ? (
            <SocialProfilePosts
              profile={selectedSocialProfile}
              onBack={this.handleBackToFeeds}
            />
          ) : (
            this.props.children
          )}
        </main>
      </>
    );
  }
}

const NavBarMenu = (props) => (
  <div className="menu-container">
    {props.isOpen ?
      <div>
        <Link to="/i/feeds/" onClick={props.closeNavBar}>
          <div className="edit-button">Organize Feeds
            <i className="fa fa-cog" aria-hidden="true"></i>
          </div>
        </Link>
      </div>
      : null
    }
    <NavBarCollapseExpand {...props} />
  </div>
);

const NavBarCollapseExpand = ({ isOpen, handleClick }) => (
  <div className="navbar-show-button">
    <span onClick={handleClick}>
      {isOpen ?
        <i className="fa fa-compress" aria-hidden="true"></i>
        : <i className="fa fa-expand" aria-hidden="true"></i>
      }
      </span>
  </div>
);

const NavBarLinks = ({ feedIds, feeds, selected, closeNavBar, socialProfiles = [], onSocialProfileClick }) => {
  const feedsList = feedIds.map(feedId => {
    const feed = feeds[feedId];
    return (
      <Link className={selected == feedId ? "selected" : ""}
        onClick={closeNavBar}
        key={feedId}
        to={`/i/subscriptions/${feed.id}`}>
        <li>
          <img src={feed.favicon_url} /> {feed.subscription_title}
        </li>
      </Link>
    );
  });

  // Helper to get the correct avatar URL for the platform
  const getAvatarUrl = (profile) => {
    // If avatar_url is a valid external URL, use it
    if (profile.avatar_url && !profile.avatar_url.startsWith('/api/')) {
      return profile.avatar_url;
    }
    // Otherwise, construct avatar URL based on platform and username
    const platform = (profile.platform || '').toLowerCase();
    const username = profile.username || '';
    switch (platform) {
      case 'twitter':
        // Twitter avatars require API, fallback to default
        return 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
      case 'facebook':
        // Facebook avatars require API, fallback to default
        return 'https://static.xx.fbcdn.net/rsrc.php/v3/yi/r/8OasGoQgQgF.png';
      case 'instagram':
        // Instagram: use their favicon as a placeholder
        return 'https://instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png';
      case 'linkedin':
        return 'https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico';
      case 'youtube':
        return 'https://www.youtube.com/s/desktop/6e2e6e7d/img/favicon_144x144.png';
      default:
        return '/default-avatar.png';
    }
  };

  const socialProfilesList = socialProfiles.length > 0 ? (
    <div className="social-profiles-list" style={{ marginTop: 24, padding: '12px 0', borderTop: '1px solid #ececec' }}>
      <div
        className="social-profiles-title"
        style={{
          fontWeight: 600,
          fontSize: 15,
          color: '#444',
          marginBottom: 10,
          letterSpacing: 0.2,
          marginLeft: 10
        }}
      >
        Social Media Profiles
      </div>

      {socialProfiles.map(profile => (
        <div
          className="social-profile-item"
          key={profile.id}
          title={profile.display_name || profile.username}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '7px 10px',
            borderRadius: 8,
            marginBottom: 6,
            textDecoration: 'none',
            background: '#f7f8fa',
            transition: 'background 0.2s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            border: '1px solid #e5e7eb',
            color: '#222',
            cursor: 'pointer',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#e9ecef'}
          onMouseOut={e => e.currentTarget.style.background = '#f7f8fa'}
          onClick={() => onSocialProfileClick && onSocialProfileClick(profile)}
        >
          <img
            className="social-profile-avatar"
            src={getAvatarUrl(profile)}
            alt={profile.display_name || profile.username}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: 12,
              border: '2px solid #d1d5db',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span className="social-profile-username" style={{ fontWeight: 500, fontSize: 15, color: '#222' }}>
              {profile.display_name || profile.username}
            </span>
            {profile.platform && (
              <span className="social-profile-platform" style={{ color: '#888', fontSize: 12, marginTop: 1 }}>
                @{profile.platform}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : null;

  return(
    <nav className="navbar-links">
      <div className="feeds">
        <Link to="/i/latest" onClick={closeNavBar}
          className={`latest${selected === "latest" ? " selected" : ""}`}>
          <li><span><i className="fa fa-bars" aria-hidden="true"></i></span>
            Latest
          </li>
        </Link>

        <Link to="/i/reads" onClick={closeNavBar}
          className={`reads${selected === "reads" ? " selected" : ""}`}>
          <li>
            <span>
              <i className="fa fa-book" aria-hidden="true"></i>
            </span>
            Recently Read
          </li>
        </Link>
        <div className="feeds-list">
          {feedsList}
        </div>
        {socialProfilesList}
      </div>
    </nav>
  );
}


// SocialProfilePosts: displays posts for a selected social profile
const getAvatarUrl = (profile) => {
  if (profile.avatar_url && !profile.avatar_url.startsWith('/api/')) {
    return profile.avatar_url;
  }
  const platform = (profile.platform || '').toLowerCase();
  switch (platform) {
    case 'twitter':
      return 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';
    case 'facebook':
      return 'https://static.xx.fbcdn.net/rsrc.php/v3/yi/r/8OasGoQgQgF.png';
    case 'instagram':
      return 'https://instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png';
    case 'linkedin':
      return 'https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico';
    case 'youtube':
      return 'https://www.youtube.com/s/desktop/6e2e6e7d/img/favicon_144x144.png';
    default:
      return '/default-avatar.png';
  }
};

const SocialProfilePosts = ({ profile, onBack }) => {
  return (
    <div style={{ padding: 32, maxWidth: 700, margin: '0 auto' }}>
      <button onClick={onBack} style={{ marginBottom: 24, background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
        ← Back to EasyFeeds
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <img src={getAvatarUrl(profile)} alt={profile.display_name || profile.username} style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #d1d5db', background: '#fff' }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{profile.display_name || profile.username}</div>
          <div style={{ color: '#888', fontSize: 14 }}>@{profile.platform}</div>
        </div>
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Posts</div>
      {/* Replace below with real posts */}
      <div style={{ background: '#f7f8fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24, textAlign: 'center', color: '#888' }}>
        <i className="fa fa-spinner fa-spin" style={{ marginRight: 8 }}></i>
        Loading posts for <b>{profile.display_name || profile.username}</b>...
      </div>
    </div>
  );
};

const NavBarAddContent = ({ closeNavBar }) => (
  <div className="add-content" onClick={closeNavBar}>
    <Link to="/i/discover">
      <span><i className="fa fa-plus" aria-hidden="true"></i></span>
      Add Content
    </Link>
  </div>
);

export default NavBar;
