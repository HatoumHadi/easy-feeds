import React, { useState } from 'react';

// AssignToFolderDialog: reusable dialog component for assigning to folders, with folder creation
export default function AssignToFolderDialog({ open, collections, selectedCollectionIds, onToggle, onCancel, onAssign, error }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleOpenCreate = () => {
    setShowCreateDialog(true);
    setNewFolderName('');
    setCreateError(null);
  };
  const handleCloseCreate = () => {
    setShowCreateDialog(false);
    setNewFolderName('');
    setCreateError(null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setCreateError('Folder name cannot be empty.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: newFolderName.trim() })
      });
      if (!res.ok) throw new Error('Failed to create folder');
      const newCol = await res.json();
      if (typeof collections.push === 'function') collections.push(newCol);
      if (onToggle) onToggle(newCol.id);
      handleCloseCreate();
    } catch (e) {
      setCreateError('Could not create folder.');
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;
  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}>
        <div style={{
          background: '#fff', borderRadius: 10, padding: 32, minWidth: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
        }}>
          <h2 style={{marginTop:0, marginBottom:16}}>Assign to Folder</h2>
          {error && (
            <div style={{ color: '#d32f2f', fontSize: 15, marginBottom: 10 }}>{error}</div>
          )}
          <div style={{maxHeight: 220, overflowY: 'auto', marginBottom: 18}}>
            {collections.length === 0 && <div style={{color:'#888', fontSize:15, marginBottom:8}}>No folders found.</div>}
            {collections.map(col => {
              const selected = selectedCollectionIds.includes(col.id);
              return (
                <label key={col.id} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f0f0f0', cursor:'pointer',
                  background: selected ? '#f3fafd' : 'transparent', borderRadius: selected ? 6 : 0, transition:'background 0.2s'
                }}>
                  <span style={{fontSize:16, color:'#222', flex:1}}>{col.name}</span>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggle(col.id)}
                    style={{width:20, height:20, accentColor:'#1976d2', marginLeft:12, cursor:'pointer'}}
                    aria-label={selected ? `Deselect ${col.name}` : `Select ${col.name}`}
                  />
                </label>
              );
            })}
          </div>
          <div style={{display:'flex', justifyContent:'flex-end', gap:12, marginTop:8}}>
            <button onClick={handleOpenCreate} style={{padding:'8px 18px', borderRadius:6, border:'1px solid #1976d2', background:'#fff', color:'#1976d2', fontWeight:600, fontSize:15, cursor:'pointer'}}>Create Folder</button>
            <button onClick={onCancel} style={{padding:'8px 18px', borderRadius:6, border:'1px solid #ccc', background:'#f5f5f5', color:'#333', fontWeight:500, fontSize:15, cursor:'pointer'}}>Cancel</button>
            <button
              onClick={onAssign}
              style={{padding:'8px 18px', borderRadius:6, border:'none', background:'#219653', color:'#fff', fontWeight:600, fontSize:15, cursor: selectedCollectionIds.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedCollectionIds.length === 0 ? 0.6 : 1}}
              disabled={selectedCollectionIds.length === 0}
            >
              Assign
            </button>
          </div>
        </div>
      </div>
      {showCreateDialog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, padding: 28, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
          }}>
            <h3 style={{marginTop:0, marginBottom:14}}>Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={e => { setNewFolderName(e.target.value); setCreateError(null); }}
              placeholder="Folder name"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 5, border: '1px solid #ccc', fontSize: 15, marginBottom: 10 }}
              disabled={creating}
              autoFocus
            />
            {createError && <div style={{ color: '#d32f2f', fontSize: 14, marginBottom: 8 }}>{createError}</div>}
            <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:8}}>
              <button onClick={handleCloseCreate} style={{padding:'7px 18px', borderRadius:5, border:'1px solid #bbb', background:'#fff', color:'#333', fontWeight:500, fontSize:15, cursor:'pointer'}}>Cancel</button>
              <button onClick={handleCreateFolder} style={{padding:'7px 18px', borderRadius:5, border:'none', background:'#1976d2', color:'#fff', fontWeight:600, fontSize:15, cursor:'pointer'}} disabled={creating || !newFolderName.trim()}>{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


