import React, { useState, useEffect } from 'react';
import { FiMapPin } from 'react-icons/fi';
import tmdbService from '../services/tmdb';
import MediaCard from '../components/MediaCard';
import useStore from '../store/useStore';
import './Movies.css'; // Reusing Movies' robust 4-grid styling pattern

const REGIONS = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
];

export default function NowPlaying() {
  const { contentLanguage } = useStore();
  const [selectedRegion, setSelectedRegion] = useState('US');
  
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchPage = async (targetPage = 1) => {
    try {
      // The TMDB `/movie/now_playing` endpoint requires the region parameter 
      // for 100% accurate locale-based theatrical listings.
      return await tmdbService.getNowPlayingPage(contentLanguage, selectedRegion, targetPage);
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
  }, [contentLanguage, selectedRegion]);

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

  return (
    <div className="movies-page container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label">In Theaters</div>
          <h1 className="page-title">Now Playing</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="movies-controls">
        <div className="filters-row">
          <div className="region-filter" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span className="genre-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiMapPin size={14} /> Theater Region:
            </span>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
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
              {REGIONS.map(reg => (
                <option key={reg.code} value={reg.code}>{reg.flag} {reg.name}</option>
              ))}
            </select>
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍿</div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No movies playing in theaters found
          </h2>
          <p>Try adjusting your theater region to scan another country.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-4 fade-in">
            {items.map((item) => (
              <MediaCard key={item.id} item={item} type="movie" />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls" style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              <div className="page-nav" style={{ marginBottom: '0.75rem', display: 'inline-flex', gap: '0.25rem', justifyContent: 'flex-start', overflowX: 'auto', maxWidth: '100%' }}>
                <button className="btn btn-secondary" disabled={page <= 1 || loading} onClick={() => goToPage(page - 1)}>
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
                <button className="btn btn-secondary" disabled={page >= totalPages || loading} onClick={() => goToPage(page + 1)}>
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
          )}
        </>
      )}
    </div>
  );
}
