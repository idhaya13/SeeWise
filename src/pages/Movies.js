import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams, useLocation } from 'react-router-dom';
import { FiFilter } from 'react-icons/fi';
import tmdbService from '../services/tmdb';
import useStore from '../store/useStore';
import MediaCard from '../components/MediaCard';
import './Movies.css';

const MOVIE_TABS = [
  { key: 'trending', label: '🔥 Trending' },
  { key: 'top', label: '⭐ Top Rated' },
  { key: 'now', label: '🎬 Now Playing' },
];

const TV_TABS = [
  { key: 'trending', label: '🔥 Trending' },
  { key: 'top', label: '⭐ Top Rated' },
  { key: 'on-air', label: '📺 On The Air' },
];

export default function Movies() {
  const { contentLanguage, regionalOnly, setRegionalOnly } = useStore();
  const activeRegional = regionalOnly || contentLanguage !== 'en';
  const [searchParams, setSearchParams] = useSearchParams();

  const location = useLocation();
  const mediaType = location.pathname.includes('/tv') ? 'tv' : 'movie';
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'trending');
  const [selectedGenre, setSelectedGenre] = useState(null);

  // Sync state with URL if it changes (e.g. clicking different nav links)
  useEffect(() => {
    setActiveTab(tabParam || 'trending');
    setSelectedGenre(null);
  }, [location.pathname, tabParam]);

  const handleTab = (key) => {
    setActiveTab(key);
    setSelectedGenre(null);
    setSearchParams({ tab: key });
  };

  // Dynamic Genre Fetching
  const { data: genres = [] } = useQuery(
    ['genres', mediaType, 'en'],
    () => mediaType === 'tv' ? tmdbService.getTVGenres('en') : tmdbService.getMovieGenres('en'),
    { staleTime: 24 * 60 * 60 * 1000 }
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

    if (activeTab === 'top') {
      base.sort_by = 'vote_average.desc';
      base['vote_count.gte'] = 100;
    }

    if (activeTab === 'trending') {
      base.sort_by = 'popularity.desc';
    }

    return base;
  };

  const fetchPage = async (targetPage = 1) => {
    const params = { ...buildParams(), page: targetPage };
    try {
      if (mediaType === 'tv') {
        if (!selectedGenre && activeTab === 'on-air') {
          return tmdbService.getOnTheAirTVPage('en', targetPage);
        }
        if (!selectedGenre && activeTab === 'top') {
          return tmdbService.getTopRatedTVPage('en', targetPage);
        }
        if (!selectedGenre && activeTab === 'trending') {
          return tmdbService.getTrendingTVPage('en', 'week', targetPage);
        }
        return tmdbService.discoverTVPage(params);
      }

      if (!selectedGenre && activeTab === 'now') {
        return tmdbService.getNowPlayingPage('en', targetPage);
      }
      if (!selectedGenre && activeTab === 'top') {
        return tmdbService.getTopRatedPage('en', targetPage);
      }
      if (!selectedGenre && activeTab === 'trending') {
        return tmdbService.getTrendingPage('en', 'week', targetPage);
      }
      return tmdbService.discoverMoviesPage(params);
    } catch (error) {
      console.error('Pagination fetch error', error);
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
  }, [mediaType, activeTab, selectedGenre, contentLanguage, activeRegional]);

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

  const currentTabs = mediaType === 'tv' ? TV_TABS : MOVIE_TABS;
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

      {/* Tabs */}
      <div className="movies-controls">
        <div className="tabs">
          {currentTabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key && !selectedGenre ? 'active' : ''}`}
              onClick={() => handleTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="filters-row">
          {/* Regional-only toggle */}
          <div className="regional-filter">
            <label className="regional-filter-label">
              <input
                type="checkbox"
                checked={regionalOnly}
                onChange={(e) => setRegionalOnly(e.target.checked)}
              />
              Show regional ({contentLanguage}) content only (OMDB)
            </label>
            <p className="regional-filter-note">(Location-based language highlighting; OMDB seeds only)</p>
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
      ) : (
        <>
          <div className="grid grid-4 fade-in">
            {items.map((item) => (
              <MediaCard key={item.id || item.guid || item.imdbID} item={item} type={mediaType} />
            ))}
          </div>

          <div className="pagination-controls" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <div className="page-nav" style={{ marginBottom: '0.75rem', display: 'inline-flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                <span className="dot-spacer" style={{ alignSelf: 'center' }}>...</span>
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
