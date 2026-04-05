// src/pages/MovieDetail.js
import React, { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiStar, FiCalendar, FiClock, FiPlay, FiX, FiArrowLeft } from 'react-icons/fi';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import tmdbService from '../services/tmdb';
import omdbService from '../services/omdb';
import MediaCard from '../components/MediaCard';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import Comments from '../components/Comments';
import './Detail.css';

export default function MovieDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const [showTrailer, setShowTrailer] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, setRating, getRating, currentUser, openSaveModal } = useStore();

  const isImdb = id?.startsWith('tt');

  const { data: item, isLoading } = useQuery(
    ['media-detail', id, type],
    () => {
      if (type === 'tv') {
        return tmdbService.getTVDetails(id);
      }
      if (type === 'movie' && isImdb) {
        return omdbService.getMovieById(id);
      }
      return tmdbService.getMovieDetails(id);
    },
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

  const isOmdb = item.imdbID && !item.id;
  const title = item.title || item.name || item.Title;
  const year = (item.release_date || item.first_air_date || item.Year || '').substring(0, 4);
  const runtime = isOmdb && item.Runtime ? item.Runtime : item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : null;
  const backdropUrl = isOmdb ? null : tmdbService.getBackdropUrl(item.backdrop_path);
  const posterUrl = isOmdb
    ? (item.Poster && item.Poster !== 'N/A' ? item.Poster : null)
    : tmdbService.getImageUrl(item.poster_path, 'w500');
  const trailerKey = isOmdb ? null : tmdbService.getTrailerKey(item.videos);
  const itemKey = item.imdbID || item.id;
  const isSaved = isInWatchlist(itemKey, type);
  const userRating = getRating(itemKey);
  const similar = isOmdb ? [] : item.similar?.results?.slice(0, 8) || [];
  const cast = isOmdb ? [] : item.credits?.cast?.slice(0, 8) || [];

  const getProviders = (data) => {
    if (!data || !data['watch/providers'] || !data['watch/providers'].results) return null;
    const res = data['watch/providers'].results;
    return res.US || res.IN || Object.values(res)[0] || null;
  };
  const providerData = isOmdb ? null : getProviders(item);
  const streamProviders = providerData?.flatrate || [];
  const rentBuyProviders = [...(providerData?.rent || []), ...(providerData?.buy || [])]
    .filter((v, i, a) => a.findIndex((t) => t.provider_id === v.provider_id) === i);
  const providerLink = providerData?.link;

  const getDirectPlatformLink = (providerName, defaultLink) => {
    const name = providerName.toLowerCase();
    const encodedTitle = encodeURIComponent(title);
    if (name.includes('netflix')) return `https://www.netflix.com/search?q=${encodedTitle}`;
    if (name.includes('amazon prime') || name.includes('prime video')) return `https://www.amazon.com/s?k=${encodedTitle}&i=instant-video`;
    if (name.includes('disney')) return `https://www.disneyplus.com/search?q=${encodedTitle}`;
    if (name.includes('hulu')) return `https://www.hulu.com/search?q=${encodedTitle}`;
    if (name.includes('max') || name.includes('hbo')) return `https://play.max.com/search/${encodedTitle}`;
    if (name.includes('apple tv')) return `https://tv.apple.com/search?term=${encodedTitle}`;
    if (name.includes('peacock')) return `https://www.peacocktv.com/search?q=${encodedTitle}`;
    if (name.includes('youtube')) return `https://www.youtube.com/results?search_query=${encodedTitle}+movie`;
    if (name.includes('google play')) return `https://play.google.com/store/search?q=${encodedTitle}&c=movies`;
    return defaultLink;
  };

  const handleRate = (ratingValue) => {
    if (!currentUser) {
      toast.error('Please login to rate movies.');
      return;
    }
    if (!itemKey) return;
    setRating(itemKey, ratingValue);
    toast.success(`Your rating (${ratingValue}/5) was saved!`);
  };

  const handleToggleSave = () => {
    openSaveModal({ ...item, id: itemKey, mediaType: type });
  };

  let isInTheaters = false;
  if (type === 'movie' && item.release_date) {
    const rDate = new Date(item.release_date);
    const now = new Date();
    const diffDays = (now - rDate) / (1000 * 60 * 60 * 24);
    // Consider it in theaters if released roughly within the last 60 days, or upcoming in next 14 days
    isInTheaters = diffDays >= -14 && diffDays <= 60;
  }

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
              {isInTheaters && (
                <a 
                  href={`https://www.google.com/search?q=BookMyShow+tickets+${encodeURIComponent(title)}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-primary btn-lg"
                  style={{ backgroundColor: '#F84464', color: '#fff', borderColor: '#F84464' }} 
                >
                  🎟️ Book Tickets
                </a>
              )}
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

            {/* User Rating */}
            <div className="detail-rating" style={{ marginTop: '1rem' }}>
              <div className="detail-rating-label">Your Rating:</div>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`rating-star ${userRating >= star ? 'active' : ''}`}
                    type="button"
                    onClick={() => handleRate(star)}
                  >
                    ★
                  </button>
                ))}
              </div>
              {userRating > 0 && (
                <div className="detail-rating-value">You rated this {userRating}/5</div>
              )}
              {!currentUser && (
                <div className="detail-rating-note">Login to save ratings permanently.</div>
              )}
            </div>
          </div>
        </div>

        {/* PROVIDERS */}
        {(streamProviders.length > 0 || rentBuyProviders.length > 0) && (
          <section className="section providers-section">
            <h2 className="section-title">📺 Where to Watch</h2>
             {streamProviders.length > 0 && (
               <div className="providers-group">
                 <h3 className="providers-group-title">Stream</h3>
                 <div className="providers-list">
                   {streamProviders.map(p => (
                     <a href={getDirectPlatformLink(p.provider_name, providerLink)} target="_blank" rel="noreferrer" key={`stream-${p.provider_id}`} className="provider-item" title={p.provider_name}>
                       <img src={tmdbService.getImageUrl(p.logo_path, 'w92')} alt={p.provider_name} className="provider-logo" />
                       <span className="provider-name">{p.provider_name}</span>
                     </a>
                   ))}
                 </div>
               </div>
             )}
             {rentBuyProviders.length > 0 && (
               <div className="providers-group">
                 <h3 className="providers-group-title">Rent / Buy</h3>
                 <div className="providers-list">
                   {rentBuyProviders.map(p => (
                     <a href={getDirectPlatformLink(p.provider_name, providerLink)} target="_blank" rel="noreferrer" key={`rentbuy-${p.provider_id}`} className="provider-item" title={p.provider_name}>
                       <img src={tmdbService.getImageUrl(p.logo_path, 'w92')} alt={p.provider_name} className="provider-logo" />
                       <span className="provider-name">{p.provider_name}</span>
                     </a>
                   ))}
                 </div>
               </div>
             )}
             {providerLink && (
               <a href={providerLink} target="_blank" rel="noreferrer" className="provider-link-btn">
                 View all options on TMDB
               </a>
             )}
          </section>
        )}

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

        {/* COMMENTS */}
        <Comments itemId={itemKey} />
      </div>
    </div>
  );
}
