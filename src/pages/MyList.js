// src/pages/MyList.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiFilm, FiBook, FiZap } from 'react-icons/fi';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import MediaCard from '../components/MediaCard';
import './MyList.css';

export default function MyList() {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    currentUser,
    guestPlaylists,
    setActivePlaylist,
    createPlaylist,
    deletePlaylist,
    removeFromPlaylist,
    removeFromUserSavedList,
  } = useStore();

  const currentPlaylists = currentUser ? (Array.isArray(currentUser.playlists) ? currentUser.playlists : []) : guestPlaylists;

  // Create a proxy for Guest active Playlist ID if not logged in
  const [guestActivePlaylistId, setGuestActivePlaylistId] = useState(guestPlaylists[0]?.id);
  const activeId = currentUser ? currentUser.activePlaylistId : guestActivePlaylistId;

  const activePlaylist = currentPlaylists.find((pl) => pl.id === activeId) || currentPlaylists[0];

  const items = activePlaylist?.items || [];

  const updateActivePlaylist = (id) => {
    if (currentUser) {
      setActivePlaylist(id);
    } else {
      setGuestActivePlaylistId(id);
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error('Playlist name cannot be empty.');
      return;
    }
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    toast.success(`Playlist '${newPlaylistName.trim()}' created.`);
  };

  const isEmpty = items.length === 0;

  const handleRemove = (item) => {
    if (activePlaylist?.id) {
      removeFromPlaylist((item.id || item.imdbID || item.olKey), activePlaylist.id);
    }
    if (currentUser) {
      removeFromUserSavedList((item.id || item.imdbID || item.olKey));
    }
    toast('Removed from playlist');
  };

  return (
    <div className="mylist-page container">
      <div className="page-header">
        <div>
          <div className="label">Your Collection</div>
          <h1 className="page-title">My List</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="mylist-stats">
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div>
            <div className="stat-num">{currentUser ? currentUser.username : 'Guest'}</div>
            <div className="stat-label">Logged In User</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📌</div>
          <div>
            <div className="stat-num">{items.length}</div>
            <div className="stat-label">Saved Items</div>
          </div>
        </div>
      </div>

      {/* Playlists */}
      <div className="playlist-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Your Playlists</h2>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
            Create and manage your lists in Spotify-style groove.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          ➕ Create Playlist
        </button>
      </div>

      <div className="playlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        {currentPlaylists.length ? currentPlaylists.map((pl) => (
          <div
            key={pl.id}
            className={`playlist-card ${activePlaylist?.id === pl.id ? 'active' : ''}`}
            style={{ border: activePlaylist?.id === pl.id ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: '10px', padding: '0.8rem', cursor: 'pointer', background: 'var(--surface)', position: 'relative' }}
          >
            <div style={{ position: 'absolute', top: '0.45rem', right: '0.45rem' }}>
              {pl.id !== 'playlist-default' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePlaylist(pl.id);
                    toast.success(`Deleted playlist '${pl.name}'`);
                  }}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                  aria-label={`Delete playlist ${pl.name}`}
                >
                  ✕
                </button>
              )}
            </div>
            <div onClick={() => updateActivePlaylist(pl.id)}>
              <strong>{pl.name}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                {pl.items.length} item{pl.items.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', padding: '1rem', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>
            You have no playlists yet. Click “Create Playlist” to start building one.
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: 'min(560px, 90vw)', background: 'var(--bg-primary)', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 18px 40px rgba(0,0,0,0.35)' }}>
            <h3 style={{ margin: '0 0 1rem' }}>Create New Playlist</h3>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Playlist name"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.75rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
              <button className="btn btn-secondary" onClick={() => { setIsCreateModalOpen(false); setNewPlaylistName(''); }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleCreatePlaylist();
                  setIsCreateModalOpen(false);
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      {isEmpty ? (
        <div className="empty-state">
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'center' }}>
            <Link to="/movies" className="btn btn-primary">
              <FiFilm /> Browse Media
            </Link>
            <Link to="/ai-recommend" className="btn btn-secondary">
              <FiZap /> AI Picks
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="mylist-count">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-4 fade-in">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                type={item.mediaType || 'movie'}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
