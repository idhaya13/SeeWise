// src/components/MediaCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookmark, FiStar } from 'react-icons/fi';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';

export default function MediaCard({ item, type = 'movie', showTitle = true }) {
  const { addToWatchlist, removeFromWatchlist, addToReadlist, removeFromReadlist, isInWatchlist, isInReadlist } = useStore();

  const isBook = type === 'book';
  const saved = isBook ? isInReadlist(item.id) : isInWatchlist(item.id, type);

  const detailPath = isBook ? `/book/${item.id}` : `/movie/${item.id}?type=${type}`;

  const coverUrl = isBook
    ? item.cover || item.coverMedium
    : item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : null;

  const title = isBook ? item.title : item.title || item.name;
  const year = isBook
    ? item.year
    : (item.release_date || item.first_air_date || '').substring(0, 4);
  const rating = isBook ? item.rating : item.vote_average?.toFixed(1);
  const subtitle = isBook ? item.author : type === 'tv' ? 'TV Series' : 'Movie';

  const handleToggleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBook) {
      if (saved) {
        removeFromReadlist(item.id);
        toast('Removed from Reading List');
      } else {
        addToReadlist({ ...item, mediaType: 'book' });
        toast.success('Added to Reading List 📚');
      }
    } else {
      if (saved) {
        removeFromWatchlist(item.id, type);
        toast('Removed from Watchlist');
      } else {
        addToWatchlist({ ...item, mediaType: type });
        toast.success('Added to Watchlist 🎬');
      }
    }
  };

  return (
    <Link to={detailPath} className="media-card">
      {/* Cover Image */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="no-poster">
          {isBook ? '📖' : '🎬'}
          <span>{isBook ? 'No Cover' : 'No Poster'}</span>
        </div>
      )}

      {/* Type Badge */}
      <div style={{
        position: 'absolute',
        top: '0.6rem',
        left: '0.6rem',
        padding: '0.2rem 0.55rem',
        background: 'rgba(10,10,15,0.85)',
        borderRadius: '100px',
        fontSize: '0.65rem',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: isBook ? 'var(--gold)' : type === 'tv' ? 'var(--teal)' : 'var(--accent)',
        border: `1px solid ${isBook ? 'rgba(245,200,66,0.25)' : type === 'tv' ? 'rgba(45,212,191,0.25)' : 'rgba(192,132,252,0.25)'}`,
        backdropFilter: 'blur(4px)',
      }}>
        {isBook ? '📚 Book' : type === 'tv' ? '📺 TV' : '🎬 Film'}
      </div>

      {/* Bookmark Button */}
      <button className={`bookmark-btn ${saved ? 'saved' : ''}`} onClick={handleToggleSave} title={saved ? 'Remove' : 'Save'}>
        {saved ? <BsBookmarkFill /> : <BsBookmark />}
      </button>

      {/* Hover Overlay */}
      <div className="media-card-overlay">
        {showTitle && (
          <>
            <p className="media-card-title">{title}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="media-card-meta">{subtitle}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {year && <span className="media-card-meta">{year}</span>}
                {rating && (
                  <span className="rating">
                    <FiStar size={10} fill="currentColor" />
                    {rating}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
