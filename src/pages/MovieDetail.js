// src/pages/MovieDetail.js
import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiStar, FiCalendar, FiClock, FiPlay, FiX, FiArrowLeft } from 'react-icons/fi';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import tmdbService from '../services/tmdb';
import MediaCard from '../components/MediaCard';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import './Detail.css';

export default function MovieDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const [showTrailer, setShowTrailer] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useStore();

  const { data: item, isLoading } = useQuery(
    ['media-detail', id, type],
    () => type === 'tv' ? tmdbService.getTVDetails(id) : tmdbService.getMovieDetails(id),
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="detail-loading">
        <div className="loading-spinner-large" style={{ margin: '8rem auto' }} />
      </div>
    );
  }

  if (!item) return null;

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').substring(0, 4);
  const runtime = item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : null;
  const backdropUrl = tmdbService.getBackdropUrl(item.backdrop_path);
  const posterUrl = tmdbService.getImageUrl(item.poster_path, 'w500');
  const trailerKey = tmdbService.getTrailerKey(item.videos);
  const isSaved = isInWatchlist(item.id, type);
  const similar = item.similar?.results?.slice(0, 8) || [];
  const cast = item.credits?.cast?.slice(0, 8) || [];

  const handleToggleSave = () => {
    if (isSaved) {
      removeFromWatchlist(item.id, type);
      toast('Removed from Watchlist');
    } else {
      addToWatchlist({ ...item, mediaType: type });
      toast.success('Added to Watchlist 🎬');
    }
  };

  return (
    <div className="detail-page">
      {/* BACKDROP */}
      {backdropUrl && (
        <div className="detail-backdrop" style={{ backgroundImage: `url(${backdropUrl})` }} />
      )}
      <div className="detail-backdrop-overlay" />

      {/* TRAILER MODAL */}
      {showTrailer && trailerKey && (
        <div className="modal-overlay" onClick={() => setShowTrailer(false)}>
          <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="trailer-close" onClick={() => setShowTrailer(false)}><FiX /></button>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="detail-content container">
        {/* Back */}
        <Link to={type === 'tv' ? '/movies?tab=tv' : '/movies'} className="back-link">
          <FiArrowLeft /> Back to {type === 'tv' ? 'TV Shows' : 'Movies'}
        </Link>

        {/* HERO INFO */}
        <div className="detail-hero">
          {/* Poster */}
          <div className="detail-poster">
            {posterUrl ? (
              <img src={posterUrl} alt={title} />
            ) : (
              <div className="no-poster" style={{ height: '400px' }}>🎬</div>
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <div className="label">{type === 'tv' ? '📺 TV Series' : '🎬 Movie'}</div>
            <h1 className="detail-title">{title}</h1>

            {/* Meta */}
            <div className="detail-meta">
              {item.vote_average > 0 && (
                <span className="badge badge-gold">
                  <FiStar fill="currentColor" size={12} />
                  {item.vote_average?.toFixed(1)} / 10
                </span>
              )}
              {year && <span className="badge badge-accent"><FiCalendar size={12} /> {year}</span>}
              {runtime && <span className="badge"><FiClock size={12} /> {runtime}</span>}
            </div>

            {/* Genres */}
            {item.genres?.length > 0 && (
              <div className="chip-group">
                {item.genres.map((g) => <span key={g.id} className="chip" style={{ cursor: 'default' }}>{g.name}</span>)}
              </div>
            )}

            {/* Overview */}
            {item.overview && (
              <p className="detail-overview">{item.overview}</p>
            )}

            {/* Director / Creator */}
            {item.credits?.crew && (
              <div className="detail-crew">
                {item.credits.crew
                  .filter((c) => c.job === 'Director' || c.job === 'Creator')
                  .slice(0, 2)
                  .map((c) => (
                    <div key={c.id} className="crew-member">
                      <span className="crew-role">{c.job}</span>
                      <span className="crew-name">{c.name}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Actions */}
            <div className="detail-actions">
              {trailerKey && (
                <button className="btn btn-primary btn-lg" onClick={() => setShowTrailer(true)}>
                  <FiPlay /> Watch Trailer
                </button>
              )}
              <button
                className={`btn btn-secondary btn-lg ${isSaved ? 'saved' : ''}`}
                onClick={handleToggleSave}
              >
                {isSaved ? <BsBookmarkFill /> : <BsBookmark />}
                {isSaved ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>

        {/* CAST */}
        {cast.length > 0 && (
          <section className="section">
            <h2 className="section-title">🎭 Cast</h2>
            <div className="cast-grid">
              {cast.map((actor) => (
                <div key={actor.id} className="cast-card">
                  {actor.profile_path ? (
                    <img
                      src={tmdbService.getImageUrl(actor.profile_path, 'w185')}
                      alt={actor.name}
                      className="cast-photo"
                    />
                  ) : (
                    <div className="cast-photo-placeholder">👤</div>
                  )}
                  <p className="cast-name">{actor.name}</p>
                  <p className="cast-char">{actor.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SIMILAR */}
        {similar.length > 0 && (
          <section className="section">
            <h2 className="section-title">🎬 More Like This</h2>
            <div className="grid grid-4">
              {similar.map((m) => <MediaCard key={m.id} item={m} type={type} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
