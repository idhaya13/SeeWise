import React, { useState } from 'react';
import { FiX, FiPlus, FiCheck } from 'react-icons/fi';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function SaveModal() {
  const { 
    saveModalState, 
    closeSaveModal, 
    currentUser, 
    guestPlaylists, 
    addToPlaylist, 
    removeFromPlaylist, 
    createPlaylist 
  } = useStore();

  const [newListName, setNewListName] = useState('');

  if (!saveModalState.isOpen || !saveModalState.item) return null;

  const item = saveModalState.item;
  const itemId = item.id || item.imdbID || item.olKey;
  const isBook = item.mediaType === 'book' || item.source === 'openlibrary' || item.source === 'google';
  const typeLabel = isBook ? 'Book' : (item.type === 'tv' ? 'TV Show' : 'Movie');
  const title = item.title || item.name;

  // Determine active playlists map based on authentication
  const activePlaylists = currentUser ? (currentUser.playlists || []) : guestPlaylists;

  const handleToggle = (playlist) => {
    const isSaved = playlist.items.some(i => (i.id || i.imdbID || i.olKey) === itemId);
    if (isSaved) {
      removeFromPlaylist(itemId, playlist.id);
      toast(`Removed from ${playlist.name}`);
    } else {
      addToPlaylist(itemId, item, playlist.id);
      toast.success(`Saved to ${playlist.name}`);
    }
  };

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createPlaylist(newListName);
    setNewListName('');
    toast.success(`Created playlist "${newListName.trim()}"`);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={closeSaveModal}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="modal-content fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          width: '90%',
          maxWidth: '450px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Save to Playlist</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{typeLabel}</span> • {title}
            </p>
          </div>
          <button 
            onClick={closeSaveModal}
            className="btn btn-ghost"
            style={{ padding: '0.5rem' }}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Existing Playlists Scroller */}
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto', 
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {activePlaylists.map(pl => {
            const isSaved = pl.items.some(i => (i.id || i.imdbID || i.olKey) === itemId);
            return (
              <label 
                key={pl.id} 
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1rem',
                  background: isSaved ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSaved ? 'rgba(79, 70, 229, 0.3)' : 'transparent'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="hover-highlight"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '24px', height: '24px',
                    borderRadius: '4px',
                    border: `2px solid ${isSaved ? 'var(--primary)' : 'var(--text-secondary)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSaved ? 'var(--primary)' : 'transparent'
                  }}>
                    {isSaved && <FiCheck color="white" size={16} />}
                  </div>
                  <span style={{ fontWeight: 500, color: isSaved ? 'white' : 'var(--text-secondary)' }}>
                    {pl.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {pl.items.length} items
                </span>
                
                {/* Hidden actual checkbox for accessibility */}
                <input 
                  type="checkbox" 
                  checked={isSaved} 
                  onChange={() => handleToggle(pl)}
                  style={{ display: 'none' }}
                />
              </label>
            )
          })}
        </div>

        {/* Inline Create Playlist */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <form onSubmit={handleCreateList} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="New playlist name..."
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              className="search-input"
              style={{ flex: 1, margin: 0, padding: '0.75rem 1rem' }}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!newListName.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1.25rem' }}
            >
              <FiPlus /> Create
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}
