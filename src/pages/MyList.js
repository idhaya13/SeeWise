// src/pages/MyList.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiFilm, FiBook, FiZap } from 'react-icons/fi';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import MediaCard from '../components/MediaCard';
import './MyList.css';

const TABS = [
  { key: 'watchlist', label: '🎬 Watchlist' },
  { key: 'readlist', label: '📚 Reading List' },
];

export default function MyList() {
  const [activeTab, setActiveTab] = useState('watchlist');
  const { watchlist, readlist, removeFromWatchlist, removeFromReadlist } = useStore();

  const items = activeTab === 'watchlist' ? watchlist : readlist;
  const isEmpty = items.length === 0;

  const handleRemove = (item) => {
    if (activeTab === 'watchlist') {
      removeFromWatchlist(item.id, item.mediaType);
      toast('Removed from Watchlist');
    } else {
      removeFromReadlist(item.id);
      toast('Removed from Reading List');
    }
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
          <div className="stat-icon">🎬</div>
          <div>
            <div className="stat-num">{watchlist.length}</div>
            <div className="stat-label">In Watchlist</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div>
            <div className="stat-num">{readlist.length}</div>
            <div className="stat-label">In Reading List</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.75rem' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            <span className="tab-badge">
              {t.key === 'watchlist' ? watchlist.length : readlist.length}
            </span>
          </button>
        ))}
      </div>

      {/* Items */}
      {isEmpty ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {activeTab === 'watchlist' ? '🎬' : '📚'}
          </div>
          <h3>Your {activeTab === 'watchlist' ? 'watchlist' : 'reading list'} is empty</h3>
          <p>
            Browse movies, TV shows, and books — hit the bookmark icon to save them here.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <Link to={activeTab === 'watchlist' ? '/movies' : '/books'} className="btn btn-primary">
              {activeTab === 'watchlist' ? <><FiFilm /> Browse Movies</> : <><FiBook /> Browse Books</>}
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
              <div key={item.id} className="mylist-item-wrapper">
                <MediaCard
                  item={item}
                  type={item.mediaType || (activeTab === 'watchlist' ? 'movie' : 'book')}
                />
                <button
                  className="remove-btn"
                  onClick={() => handleRemove(item)}
                  title="Remove"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
