
import React from 'react';
import { Link } from 'react-router-dom';
import { fetchCollectionsWithFeedsAndSocialMediaProfiles, removeCollectionItem } from '../../util/collections_api_util';

class NavBar extends React.Component {
  // Allow other parts of the app to trigger a collections update without full refresh
  componentDidUpdate() {
    if (typeof window !== 'undefined') {
      window.refreshNavBarCollections = this.fetchCollectionsData;
    }
  }
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
    selectedSocialProfile: null, // Track selected social profile
    collections: [],
    loadingCollections: true,
    collectionsError: null
  };

  componentDidMount() {
    this.handleResize();
    addEventListener('resize', this.handleResize, false);
    this.fetchCollectionsData();
    // Listen for folder refresh events from other components
    window.addEventListener('refresh-navbar-folders', this.fetchCollectionsData);
  }

  fetchCollectionsData = async () => {
    this.setState({ loadingCollections: true, collectionsError: null });
    try {
      const flatRows = await fetchCollectionsWithFeedsAndSocialMediaProfiles();
      // Group by collection
      const collectionsMap = {};
      flatRows.forEach(row => {
        if (!collectionsMap[row.id]) {
          collectionsMap[row.id] = {
            id: row.id,
            name: row.name,
            feeds: [],
            socialProfiles: []
          };
        }
        if (row.collection_item_type === 'Feed' && row.feed_id) {
          collectionsMap[row.id].feeds.push({
            id: row.feed_id,
            title: row.feed_title,
            rss_url: row.feed_rss_url,
            description: row.feed_description,
            favicon_url: row.feed_favicon_url,
            subscription_title: row.feed_title, // for compatibility
            collection_id: row.id
          });
        }
        if (row.collection_item_type === 'SocialMediaProfile' && row.social_profile_id) {
          collectionsMap[row.id].socialProfiles.push({
            id: row.social_profile_id,
            username: row.social_profile_username,
            display_name: row.social_profile_username,
            platform: row.social_profile_platform,
            avatar_url: row.social_profile_avatar_url,
            collection_id: row.id
          });
        }
      });
      this.setState({
        collections: Object.values(collectionsMap),
        loadingCollections: false
      });
    } catch (err) {
      this.setState({ collectionsError: err.message, loadingCollections: false });
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
    window.removeEventListener('refresh-navbar-folders', this.fetchCollectionsData);
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
    const { isOpen, selected, selectedSocialProfile, collections, loadingCollections, collectionsError } = this.state;

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
              {loadingCollections ? (
                <div style={{ padding: 24, color: '#888' }}>Loading folders...</div>
              ) : collectionsError ? (
                <div style={{ padding: 24, color: '#d32f2f' }}>Error: {collectionsError}</div>
              ) : (
                <NavBarLinks
                  selected={selected}
                  closeNavBar={this.closeNavBar}
                  onSocialProfileClick={this.handleSocialProfileClick}
                  collections={collections}
                />
              )}
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




// Generic confirmation dialog component
const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onCancel, onConfirm, danger }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(22,16,74,0.13)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        minWidth: 320,
        maxWidth: 380,
        padding: 32,
        boxShadow: '0 8px 32px rgba(22,163,74,0.13)',
        border: '1.5px solid #bbf7d0',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button onClick={onCancel} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 22, color: '#16a34a', cursor: 'pointer' }}>
          <i className="fa fa-times"></i>
        </button>
        <div style={{ fontWeight: 700, fontSize: 18, color: danger ? '#dc2626' : '#166534', marginBottom: 10 }}>
          {title}
        </div>
        <div style={{ marginBottom: 18, color: '#444', fontSize: 15 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              background: '#e8f7ec', color: '#166534', border: '1.5px solid #bbf7d0', borderRadius: 8,
              padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', minWidth: 90
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: danger ? '#dc2626' : '#16a34a', color: '#fff', border: '1.5px solid #bbf7d0', borderRadius: 8,
              padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', minWidth: 90
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// NavBarLinks: Render only folders (collections) and their grouped feeds and social profiles, with search and expand/collapse all
const NavBarLinks = ({ selected, closeNavBar, onSocialProfileClick, collections = [] }) => {
  // State for expanded/collapsed folders (in functional component, use window for persistence)
  if (!window._navbarFolderOpen) window._navbarFolderOpen = {};
  const [search, setSearch] = React.useState("");
  const [ignored, forceUpdate] = React.useReducer(x => x + 1, 0);
  // Track selected feed by composite key (feed id + collection id)
  const [selectedFeedKey, setSelectedFeedKey] = React.useState(null);
  // State for custom remove confirmation modal
  const [removeFeedState, setRemoveFeedState] = React.useState({ open: false, feed: null, folder: null });

  // Expand/collapse helpers
  const toggleFolder = (id) => {
    window._navbarFolderOpen[id] = !window._navbarFolderOpen[id];
    window.dispatchEvent(new Event('navbar-folder-toggle'));
  };
  const expandAll = () => {
    collections.forEach(col => { window._navbarFolderOpen[col.id] = true; });
    window.dispatchEvent(new Event('navbar-folder-toggle'));
  };
  const collapseAll = () => {
    collections.forEach(col => { window._navbarFolderOpen[col.id] = false; });
    window.dispatchEvent(new Event('navbar-folder-toggle'));
  };

  React.useEffect(() => {
    const handler = () => forceUpdate();
    window.addEventListener('navbar-folder-toggle', handler);
    return () => window.removeEventListener('navbar-folder-toggle', handler);
  }, []);

  // Helper to get the correct avatar URL for the platform
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

  // Filtered folders by search
  const filteredCollections = search.trim()
    ? collections.filter(col => col.name.toLowerCase().includes(search.trim().toLowerCase()))
    : collections;

  // Render folders (collections) and their feeds and social profiles
  const foldersList = filteredCollections.length > 0 ? filteredCollections.map(col => {
    const isOpen = window._navbarFolderOpen[col.id] !== false;
    return (
      <div key={col.id} className="navbar-folder-group" style={{ marginBottom: 8 }}>
        <div
          className="navbar-folder-header"
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 600, fontSize: 15, color: '#166534', background: isOpen ? '#f6fff8' : '#f7f8fa', borderRadius: 8, padding: '7px 10px', border: '1.5px solid #bbf7d0', marginBottom: 2 }}
          onClick={e => {
            // Only expand/collapse, never navigate
            e.preventDefault();
            toggleFolder(col.id);
          }}
        >
          <i className={`fa ${isOpen ? 'fa-folder-open' : 'fa-folder'}`} style={{ marginRight: 8, color: '#16a34a' }}></i>
          {col.name}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#16a34a' }}>{(col.feeds?.length || 0) + (col.socialProfiles?.length || 0)}</span>
        </div>
        {isOpen && (
          <div style={{ marginLeft: 18, marginTop: 2 }}>
            {/* Feeds */}
            {col.feeds && col.feeds.length > 0 && (
              <div className="navbar-folder-feeds" style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#166534', margin: '2px 0 2px 2px', letterSpacing: 0.2, opacity: 0.85 }}>
                  Feeds
                </div>
                {col.feeds.map(feed => {
                  const feedKey = `${feed.id}_${col.id}`;
                  return (
                    <div key={feedKey} style={{ display: 'flex', alignItems: 'center' }}>
                      <Link
                        className={selectedFeedKey === feedKey ? "selected" : ""}
                        onClick={e => {
                          setSelectedFeedKey(feedKey);
                          closeNavBar();
                        }}
                        to={`/i/subscriptions/${feed.id}`}
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        <li style={{ display: 'flex', alignItems: 'center', padding: '6px 0', borderRadius: 6 }}>
                          <img src={feed.favicon_url} style={{ width: 18, height: 18, marginRight: 8, borderRadius: 3, background: '#fff', border: '1px solid #e5e7eb' }} />
                          {feed.title}
                        </li>
                      </Link>
                      <button
                        title="Remove from folder"
                        aria-label="Remove from folder"
                        style={{
                          marginLeft: 6,
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: 18,
                          padding: 0,
                          display: 'none',
                          alignItems: 'center',
                          transition: 'color 0.18s',
                        }}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          setRemoveFeedState({ open: true, feed, folder: col });
                        }}
                      >
                        <i className="fa fa-trash" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Social Profiles */}
            {col.socialProfiles && col.socialProfiles.length > 0 && (
              <div className="navbar-folder-social-profiles" style={{ marginTop: 10, marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#166534', margin: '2px 0 2px 2px', letterSpacing: 0.2, opacity: 0.85 }}>
                  Social Media
                </div>
                {col.socialProfiles.map(profile => (
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
                      background: '#f6fff8',
                      transition: 'background 0.2s',
                      boxShadow: '0 1px 2px rgba(22,163,74,0.07)',
                      border: '1.5px solid #bbf7d0',
                      color: '#166534',
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
                        border: '2px solid #bbf7d0',
                        background: '#fff',
                        boxShadow: '0 1px 4px rgba(22,163,74,0.09)'
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
                    {/* Plus button removed as requested */}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }) : null;

  return (
    <>
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
          <div className="feeds-list" style={{ marginTop: 8, overflow: 'unset', width: '100%' }}>
            {filteredCollections.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 8, width: '97%' }}>
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 8, border: '1.5px solid #bbf7d0', fontSize: 15, color: '#166534', background: '#f6fff8', marginBottom: 4 }}
                  aria-label="Search folders"
                />
                <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end', marginBottom: 6 }}>
                  <button
                    onClick={expandAll}
                    style={{
                      background: '#e8f7ec',
                      color: '#16a34a',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: '50%',
                      padding: 0,
                      width: 28,
                      height: 28,
                      minWidth: 28,
                      minHeight: 28,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'background 0.18s, box-shadow 0.18s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(22,163,74,0.07)',
                    }}
                    title="Expand all folders"
                    aria-label="Expand all folders"
                    onMouseOver={e => e.currentTarget.style.background = '#bbf7d0'}
                    onMouseOut={e => e.currentTarget.style.background = '#e8f7ec'}
                  >
                    <i className="fa fa-plus-square" />
                  </button>
                  <button
                    onClick={collapseAll}
                    style={{
                      background: '#f7f8fa',
                      color: '#166534',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: '50%',
                      padding: 0,
                      width: 28,
                      height: 28,
                      minWidth: 28,
                      minHeight: 28,
                      fontSize: 16,
                      cursor: 'pointer',
                      transition: 'background 0.18s, box-shadow 0.18s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 4px rgba(22,163,74,0.07)',
                    }}
                    title="Collapse all folders"
                    aria-label="Collapse all folders"
                    onMouseOver={e => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseOut={e => e.currentTarget.style.background = '#f7f8fa'}
                  >
                    <i className="fa fa-minus-square" />
                  </button>
                </div>
              </div>
            )}
            {foldersList}
          </div>
        </div>
      </nav>
      <ConfirmDialog
        open={removeFeedState.open}
        title="Remove Feed"
        message={removeFeedState.feed && removeFeedState.folder ? (
          <span>
            Are you sure you want to remove <b>{removeFeedState.feed.title}</b> from folder <b>{removeFeedState.folder.name}</b>?
          </span>
        ) : ''}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        danger={true}
        onCancel={() => setRemoveFeedState({ open: false, feed: null, folder: null })}
        onConfirm={async () => {
          const { feed, folder } = removeFeedState;
          setRemoveFeedState({ open: false, feed: null, folder: null });
          try {
            await removeCollectionItem(folder.id, 'feed', feed.id);
            // Update collections state directly for immediate UI update
            if (typeof collections !== 'undefined' && Array.isArray(collections)) {
              const folderIdx = collections.findIndex(c => c.id === folder.id);
              if (folderIdx !== -1) {
                collections[folderIdx] = {
                  ...collections[folderIdx],
                  feeds: collections[folderIdx].feeds.filter(f => f.id !== feed.id)
                };
                forceUpdate();
              }
            } else {
              forceUpdate();
            }
          } catch (err) {
            alert('Error: ' + err.message);
          }
        }}
      />
    </>
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
// Simple modal stub for moving items to folders
import ReactDOM from 'react-dom';
class MoveToFolderModal extends React.Component {
  state = {
    selectedFolderId: '',
    newFolderName: '',
    creating: false,
    error: '',
    success: false
  };

  handleSelectChange = e => {
    this.setState({ selectedFolderId: e.target.value, creating: false, newFolderName: '', error: '', success: false });
  };
  handleNewFolderChange = e => {
    this.setState({ newFolderName: e.target.value, error: '', success: false });
  };
  handleCreateNew = () => {
    this.setState({ creating: true, selectedFolderId: '', error: '', success: false });
  };
  handleMove = () => {
    const { selectedFolderId, newFolderName, creating } = this.state;
    if (creating && !newFolderName.trim()) {
      this.setState({ error: 'Folder name required.' });
      return;
    }
    if (!creating && !selectedFolderId) {
      this.setState({ error: 'Please select a folder.' });
      return;
    }
    // Call onMove with folder info
    this.props.onMove(creating ? { name: newFolderName } : { id: selectedFolderId });
    // Dispatch event to update NavBar folders
    window.dispatchEvent(new Event('refresh-navbar-folders'));
    this.setState({ success: true });
    setTimeout(() => this.props.onClose(), 900);
  };
  handleCancelCreate = () => {
    this.setState({ creating: false, newFolderName: '', error: '', success: false });
  };

  render() {
    const { visible, onClose, item, type, collections = [] } = this.props;
    const { selectedFolderId, newFolderName, creating, error, success } = this.state;
    if (!visible) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(22,163,74,0.08)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 18, minWidth: 340, maxWidth: 400, padding: 36, boxShadow: '0 8px 32px rgba(22,163,74,0.13)', position: 'relative', border: '1.5px solid #bbf7d0' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 22, color: '#16a34a', cursor: 'pointer' }}>
            <i className="fa fa-times"></i>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            <img src={type === 'profile' ? (item.avatar_url || '/default-avatar.png') : (item.favicon_url || '/favicon.ico')} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #bbf7d0', background: '#fff', boxShadow: '0 2px 8px rgba(22,163,74,0.07)' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#166534', marginBottom: 2 }}>{type === 'profile' ? (item.display_name || item.username) : item.subscription_title}</div>
              {type === 'profile' && <div style={{ color: '#16a34a', fontSize: 13 }}>@{item.platform}</div>}
            </div>
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 14, color: '#166534', letterSpacing: 0.2 }}>Add to Folder</div>
          {success ? (
            <div style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600, fontSize: 16, margin: '18px 0' }}>
              <i className="fa fa-check-circle" style={{ fontSize: 22, marginRight: 8 }}></i>
              Added successfully!
            </div>
          ) : !creating ? (
            <React.Fragment>
              <select value={selectedFolderId} onChange={this.handleSelectChange} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bbf7d0', marginBottom: 14, fontSize: 16, background: '#f6fff8', color: '#166534' }}>
                <option value="">Select existing folder...</option>
                {collections.map(col => (
                  <option key={col.id} value={col.id}>{col.name}</option>
                ))}
              </select>
              <button onClick={this.handleCreateNew} style={{ width: '100%', background: '#e8f7ec', color: '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginBottom: 12, transition: 'background 0.2s' }}>
                <i className="fa fa-folder-plus" style={{ marginRight: 7 }}></i> Create New Folder
              </button>
              <button onClick={this.handleMove} style={{ width: '100%', background: selectedFolderId ? '#16a34a' : '#e8f7d0', color: selectedFolderId ? '#fff' : '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: selectedFolderId ? 'pointer' : 'not-allowed', marginBottom: 10, transition: 'background 0.2s' }} disabled={!selectedFolderId}>
                <i className="fa fa-check" style={{ marginRight: 7 }}></i> Add to Folder
              </button>
              {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</div>}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <input
                type="text"
                placeholder="New folder name"
                value={newFolderName}
                onChange={this.handleNewFolderChange}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bbf7d0', marginBottom: 14, fontSize: 16, background: '#f6fff8', color: '#166534' }}
              />
              <button onClick={this.handleMove} style={{ width: '100%', background: newFolderName ? '#16a34a' : '#e8f7d0', color: newFolderName ? '#fff' : '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: newFolderName ? 'pointer' : 'not-allowed', marginBottom: 10, transition: 'background 0.2s' }} disabled={!newFolderName}>
                <i className="fa fa-check" style={{ marginRight: 7 }}></i> Create & Add
              </button>
              <button onClick={this.handleCancelCreate} style={{ width: '100%', background: '#e8f7ec', color: '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 4, transition: 'background 0.2s' }}>
                Cancel
              </button>
              {error && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{error}</div>}
            </React.Fragment>
          )}
        </div>
      </div>
    );
  }
}

// Ensure modal receives folders array
window.openMoveToFolderModal = (item, type, collections) => {
  if (!window._moveToFolderModalRoot) {
    window._moveToFolderModalRoot = document.createElement('div');
    document.body.appendChild(window._moveToFolderModalRoot);
  }
  let localCollections = Array.isArray(collections) ? [...collections] : [];
  const close = () => {
    ReactDOM.unmountComponentAtNode(window._moveToFolderModalRoot);
  };
  const handleMove = async folder => {
    try {
      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (folder.name) {
        // Create new folder and add item (API)
        const res = await fetch('/api/collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({
            name: folder.name,
            item_type: type,
            item_id: item.id
          })
        });
        if (!res.ok) throw new Error('Failed to create folder');
        const data = await res.json();
        alert(`Created folder '${folder.name}' and added ${item.display_name || item.username || item.subscription_title}`);
      } else {
        // Add to existing folder (API)
        const res = await fetch(`/api/collections/${folder.id}/add_item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken
          },
          body: JSON.stringify({
            item_type: type,
            item_id: item.id
          })
        });
        if (!res.ok) throw new Error('Failed to add to folder');
        alert(`Added ${item.display_name || item.username || item.subscription_title} to folder '${localCollections.find(c => c.id == folder.id)?.name}'`);
      }
      // Dispatch event to update NavBar folders
      window.dispatchEvent(new Event('refresh-navbar-folders'));
      close();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };
  ReactDOM.render(
    <MoveToFolderModal visible={true} onClose={close} item={item} type={type} collections={localCollections} onMove={handleMove} />,
    window._moveToFolderModalRoot
  );
}
