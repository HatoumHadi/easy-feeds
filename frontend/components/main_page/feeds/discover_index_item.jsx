import React from 'react';
import { Link } from 'react-router-dom';

function DiscoverIndexItem({ feed, deleteFeed, createFeed }) {
  return (
    <div key={feed.id} className="search-item">
      <div className="feed-search-name">
        <img src={feed.favicon_url} className="feed-index-icon" />
        <div className="feed-search-description">
          <Link to={`/i/discover/${feed.id}`}>
            <h3>{feed.title}</h3>
          </Link>
          <p>{feed.description}</p>
        </div>
      </div>
      <div>
        {feed.subscribed ?
          <UnsubscribeButton {...{feed, deleteFeed}} /> :
          <SubscribeButton {...{feed, createFeed}} />
          }
        </div>
      </div>
  );
}

class UnsubscribeButton extends React.Component {
  state = { hovering: false };

  render() {
    return (
      <button className="following-button discover-button"
        onMouseOver={e => this.setState({hovering: true})}
        onMouseLeave={e => this.setState({hovering: false})}
        onClick={e => this.props.deleteFeed(this.props.feed)}
      >
        { this.state.hovering ? "Unfollow?" : "Following" }
      </button>
    );
  }
}

class SubscribeButton extends React.Component {
  state = {
    showDialog: false,
    collections: [],
    selectedCollectionIds: [],
    loading: false,
    newCollectionName: '',
    creatingCollection: false,
    createError: '',
    showCreateDialog: false
  };

  openDialog = async () => {
    this.setState({ showDialog: true, loading: true, newCollectionName: '', createError: '', selectedCollectionIds: [] });
    try {
      const res = await fetch('/api/collections');
      const collections = await res.json();
      this.setState({ collections, loading: false });
    } catch {
      this.setState({ collections: [], loading: false });
    }
  };

  closeDialog = () => {
    this.setState({ showDialog: false, selectedCollectionIds: [], newCollectionName: '', createError: '' });
  };
  handleNewCollectionNameChange = (e) => {
    this.setState({ newCollectionName: e.target.value, createError: '' });
  };

  openCreateDialog = () => {
    this.setState({ showCreateDialog: true, newCollectionName: '', createError: '' });
  };

  closeCreateDialog = () => {
    this.setState({ showCreateDialog: false, newCollectionName: '', createError: '' });
  };

  handleCollectionToggle = (colId) => {
    this.setState(prev => {
      const selected = prev.selectedCollectionIds;
      if (selected.includes(colId)) {
        return { selectedCollectionIds: selected.filter(id => id !== colId) };
      } else {
        return { selectedCollectionIds: [...selected, colId] };
      }
    });
  };

  handleCreateCollection = async () => {
    const { newCollectionName, collections } = this.state;
    if (!newCollectionName.trim()) {
      this.setState({ createError: 'Collection name required.' });
      return;
    }
    this.setState({ creatingCollection: true, createError: '' });
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName })
      });
      if (!res.ok) throw new Error('Failed to create collection');
      const newCol = await res.json();
      const updatedCollections = [...collections, newCol];
      this.setState(prev => ({
        collections: updatedCollections,
        selectedCollectionIds: [...prev.selectedCollectionIds, newCol.id],
        newCollectionName: '',
        creatingCollection: false,
        createError: '',
        showCreateDialog: false
      }));
    } catch {
      this.setState({ createError: 'Could not create collection.', creatingCollection: false });
    }
  };

  confirmFollow = () => {
    // Call your createFeed as before
    this.props.createFeed(this.props.feed);
    // Call the add_item endpoint for each selected collection
    this.state.selectedCollectionIds.forEach(colId => {
      fetch(`/api/collections/${colId}/add_items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: 'Feed',
          item_id: this.props.feed.id
        })
      });
    });
    this.closeDialog();
  };

  render() {
    return (
      <>
        <button
          className="follow-button discover-button"
          onClick={this.openDialog}
        >
          Follow
        </button>
        {this.state.showDialog && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}>
            <div style={{
              background: '#fff', borderRadius: 10, padding: 32, minWidth: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
            }}>
              <h2 style={{marginTop:0, marginBottom:16}}>Select Folder</h2>
              {this.state.loading ? (
                <div>Loading folders...</div>
              ) : (
                <>
                  <div style={{maxHeight: 220, overflowY: 'auto', marginBottom: 18}}>
                    {this.state.collections.length === 0 && <div style={{color:'#888', fontSize:15, marginBottom:8}}>No folders found.</div>}
                    {this.state.collections.map(col => {
                      const selected = this.state.selectedCollectionIds.includes(col.id);
                      return (
                        <div key={col.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f0f0f0'}}>
                          <span style={{fontSize:16, color:'#222'}}>{col.name}</span>
                          <button
                            style={{
                              padding:'6px 16px', borderRadius:6, border: selected ? '2px solid #219653' : '1px solid #ccc',
                              background: selected ? '#eafaf1' : '#f5f5f5',
                              color: selected ? '#219653' : '#333', fontWeight:600, fontSize:15, cursor:'pointer'
                            }}
                            onClick={() => this.handleCollectionToggle(col.id)}
                          >
                            {selected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{margin:'18px 0 0 0', borderTop:'1px solid #eee', paddingTop:16}}>
                    <button
                      onClick={this.openCreateDialog}
                      style={{display:'flex', alignItems:'center', gap:8, background:'none', border:'none', color:'#1976d2', fontWeight:600, fontSize:16, cursor:'pointer', padding:0}}
                    >
                      <span style={{fontSize:22, display:'flex', alignItems:'center'}}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#1976d2"/><rect x="9" y="5" width="2" height="10" rx="1" fill="#fff"/><rect x="5" y="9" width="10" height="2" rx="1" fill="#fff"/></svg>
                      </span>
                      Create folder
                    </button>
                  </div>
                </>
              )}
              <div style={{display:'flex', justifyContent:'flex-end', gap:12, marginTop:32}}>
                <button onClick={this.closeDialog} style={{padding:'8px 18px', borderRadius:6, border:'1px solid #ccc', background:'#f5f5f5', color:'#333', fontWeight:500, fontSize:15, cursor:'pointer'}}>Cancel</button>
                <button onClick={this.confirmFollow} style={{padding:'8px 18px', borderRadius:6, border:'none', background:'#219653', color:'#fff', fontWeight:600, fontSize:15, cursor:'pointer'}}>Assign</button>
              </div>

              {/* Create Folder Dialog */}
              {this.state.showCreateDialog && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                  background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
                }}>
                  <div style={{
                    background: '#fff', borderRadius: 10, padding: 28, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
                  }}>
                    <h3 style={{marginTop:0, marginBottom:12}}>Create New Folder</h3>
                    <input
                      type="text"
                      value={this.state.newCollectionName}
                      onChange={this.handleNewCollectionNameChange}
                      placeholder="Folder name"
                      style={{width:'100%', padding:8, borderRadius:6, border:'1px solid #ccc', marginBottom:12, fontSize:16}}
                      disabled={this.state.creatingCollection}
                      autoFocus
                    />
                    {this.state.createError && <div style={{color:'#d32f2f', fontSize:13, marginBottom:8}}>{this.state.createError}</div>}
                    <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
                      <button onClick={this.closeCreateDialog} style={{padding:'8px 18px', borderRadius:6, border:'1px solid #ccc', background:'#f5f5f5', color:'#333', fontWeight:500, fontSize:15, cursor:'pointer'}}>Cancel</button>
                      <button
                        onClick={this.handleCreateCollection}
                        style={{padding:'8px 18px', borderRadius:6, border:'none', background:'#1976d2', color:'#fff', fontWeight:600, fontSize:15, cursor:'pointer'}}
                        disabled={this.state.creatingCollection || !this.state.newCollectionName.trim()}
                      >
                        {this.state.creatingCollection ? 'Creating...' : 'Create'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }
}

export default DiscoverIndexItem;
