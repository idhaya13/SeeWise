import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams, useLocation } from 'react-router-dom';
import { FiFilter, FiGlobe } from 'react-icons/fi';
import tmdbService from '../services/tmdb';
import useStore from '../store/useStore';
import MediaCard from '../components/MediaCard';
import './Movies.css';



const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
];

export default function Movies() {
  const { contentLanguage, setContentLanguage } = useStore();
  const activeRegional = contentLanguage !== 'en';
  const [searchParams, setSearchParams] = useSearchParams();

  const location = useLocation();
  const mediaType = location.pathname.includes('/tv') ? 'tv' : 'movie';
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Check if TMDB API key is configured
  const hasApiKey = !!process.env.REACT_APP_TMDB_API_KEY;

  // Sync state with URL if it changes (e.g. clicking different nav links)
  useEffect(() => {
    setSelectedGenre(null);
  }, [location.pathname]);

  // Dynamic Genre Fetching
  const { data: genres = [], error: genresError } = useQuery(
    ['genres', mediaType, 'en'],
    () => mediaType === 'tv' ? tmdbService.getTVGenres('en') : tmdbService.getMovieGenres('en'),
    { staleTime: 24 * 60 * 60 * 1000, enabled: hasApiKey }
  );

  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const buildParams = () => {
    const base = { language: 'en' };
    if (activeRegional) {
      base.with_original_language = contentLanguage;
    }

    if (selectedGenre) {
      base.with_genres = selectedGenre;
    }

    base.sort_by = 'popularity.desc';

    return base;
  };

  const fetchPage = async (targetPage = 1) => {
    const params = { ...buildParams(), page: targetPage };
    try {
      if (mediaType === 'tv') {
        return tmdbService.discoverTVPage(params);
      }

      return tmdbService.discoverMoviesPage(params);
    } catch (error) {
      console.error('Pagination fetch error', error);
      setApiError(error);
      return { results: [], page: 1, total_pages: 1 };
    }
  };

  useEffect(() => {
    let isActive = true;
    const init = async () => {
      setLoading(true);
      const data = await fetchPage(1);
      if (!isActive) return;
      setItems(data.results || []);
      setTotalPages(data.total_pages || 1);
      setPage(data.page || 1);
      setLoading(false);
    };
    init();
    return () => { isActive = false; };
  }, [mediaType, selectedGenre, contentLanguage, activeRegional]);

  const goToPage = async (targetPage) => {
    if (targetPage < 1 || targetPage > totalPages) return;
    setLoading(true);
    const data = await fetchPage(targetPage);
    setItems(data.results || []);
    setPage(data.page || targetPage);
    setTotalPages(data.total_pages || totalPages);
    setLoading(false);
  };

  const loadMore = async () => {
    if (page >= totalPages) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    const data = await fetchPage(nextPage);
    setItems((prev) => [...prev, ...(data.results || [])]);
    setPage(data.page || nextPage);
    setTotalPages(data.total_pages || totalPages);
    setIsLoadingMore(false);
  };

  const getPageList = () => {
    const maxButtons = 9;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  };

  const authError = genresError || apiError;
  const apiErrorMessage = !hasApiKey
    ? 'TMDB API key is not configured. Please set REACT_APP_TMDB_API_KEY in your deployment environment.'
    : authError?.message;

  if (!hasApiKey || authError) {
    return (
      <div className="movies-page container">
        <div className="page-header">
          <div>
            <div className="label">Error</div>
            <h1 className="page-title">{!hasApiKey ? 'API Configuration Required' : 'TMDB Authorization Error'}</h1>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }} className="fade-in">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {!hasApiKey ? 'TMDB API Key Required' : 'Unable to load movies and TV shows'}
          </h2>
          <p style={{ marginBottom: '2rem' }}>
            {apiErrorMessage}
          </p>
          <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>How to fix this:</h3>
            <ol style={{ textAlign: 'left', color: 'var(--text-secondary)' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <strong>For Vercel deployment:</strong> Go to your Vercel dashboard → Project Settings → Environment Variables
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Add these environment variables:
                <ul style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                  <li><code style={{ background: 'var(--bg-primary)', padding: '2px 4px', borderRadius: '4px' }}>REACT_APP_TMDB_API_KEY</code> = your TMDB API key</li>
                  <li><code style={{ background: 'var(--bg-primary)', padding: '2px 4px', borderRadius: '4px' }}>REACT_APP_TMDB_BASE_URL</code> = https://api.themoviedb.org/3</li>
                  <li><code style={{ background: 'var(--bg-primary)', padding: '2px 4px', borderRadius: '4px' }}>REACT_APP_TMDB_IMAGE_BASE</code> = https://image.tmdb.org/t/p</li>
                </ul>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Redeploy your application
              </li>
              <li>
                <strong>Get a free TMDB API key at:</strong> <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>themoviedb.org</a>
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = mediaType === 'tv' ? 'TV Shows' : 'Movies';

  return (
    <div className="movies-page container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label">Browse</div>
          <h1 className="page-title">{pageTitle}</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="movies-controls">
        <div className="filters-row">
          {/* Region Select */}
          <div className="region-filter" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span className="genre-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FiGlobe size={14} /> Region:</span>
            <select 
              value={contentLanguage}
              onChange={(e) => setContentLanguage(e.target.value)}
              style={{
                padding: '6px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border)', 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
              ))}
            </select>
          </div>

          {/* Genre Filter */}
          <div className="genre-filter">
            <span className="genre-filter-label"><FiFilter size={14} /> Genre:</span>
            <div className="chip-group">
              {genres.map((g) => (
                <button
                  key={g.id}
                  className={`chip ${selectedGenre === g.id ? 'selected' : ''}`}
                  onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }} className="fade-in">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No {mediaType === 'tv' ? 'shows' : 'movies'} found
          </h2>
          <p>Try clearing or adjusting your region and genre filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-4 card-row-scroll fade-in">
            {items.map((item) => (
              <MediaCard key={item.id || item.guid || item.imdbID} item={item} type={mediaType} />
            ))}
          </div>

          <div className="pagination-controls" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <div className="page-nav" style={{ marginBottom: '0.75rem', display: 'inline-flex', gap: '0.25rem', justifyContent: 'center', overflowX: 'auto', maxWidth: '100%' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1 || loading}
                onClick={() => goToPage(page - 1)}
              >
                Prev
              </button>
              {getPageList().map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`btn ${page === pageNumber ? 'btn-primary' : 'btn-secondary'}`}
                  disabled={page === pageNumber || loading}
                  onClick={() => goToPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              {totalPages > getPageList().length && page < totalPages - 4 && (
                <span className="dot-spacer" style={{ alignSelf: 'center', padding: '0 0.5rem' }}>...</span>
              )}
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages || loading}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </button>
            </div>

            <div>
              <button className="btn btn-primary" disabled={isLoadingMore || page >= totalPages} onClick={loadMore}>
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>

            <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Page {page} / {totalPages}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
