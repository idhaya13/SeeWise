import React, { useState, useEffect } from 'react';
import { FiClock, FiFilm, FiTv, FiBook } from 'react-icons/fi';
import tmdbService from '../services/tmdb';
import booksService from '../services/books';
import MediaCard from '../components/MediaCard';
import useStore from '../store/useStore';
import './Movies.css';

export default function QuickWatch() {
  const { contentLanguage } = useStore();

  const [mediaType, setMediaType] = useState('movie'); // 'movie', 'tv', 'book'
  const [maxTime, setMaxTime] = useState(120); // minutes
  const [selectedGenre, setSelectedGenre] = useState('');
  
  const [genres, setGenres] = useState([]);
  
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isError, setIsError] = useState(false);

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  // Load genres based on mediaType
  useEffect(() => {
    let isActive = true;
    const fetchGenres = async () => {
      try {
        if (mediaType === 'movie') {
          const list = await tmdbService.getMovieGenres(contentLanguage);
          if (isActive) setGenres(list);
        } else if (mediaType === 'tv') {
          const list = await tmdbService.getTVGenres(contentLanguage);
          if (isActive) setGenres(list);
        } else {
          // Hardcoded general book subjects
          if (isActive) {
            setGenres([
              { id: 'fiction', name: 'Fiction' },
              { id: 'mystery', name: 'Mystery' },
              { id: 'science-fiction', name: 'Science Fiction' },
              { id: 'fantasy', name: 'Fantasy' },
              { id: 'romance', name: 'Romance' },
              { id: 'thriller', name: 'Thriller' },
              { id: 'short-stories', name: 'Short Stories' },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load genres', err);
      }
    };
    fetchGenres();
    return () => { isActive = false; };
  }, [mediaType, contentLanguage]);

  // Set default genre when genres load or mediaType changes
  useEffect(() => {
    if (genres.length > 0) {
      if (mediaType === 'book') {
         setSelectedGenre('short-stories'); // good default for quick reads
      } else {
         setSelectedGenre(genres[0].id.toString());
      }
    }
    setPage(1);
    setItems([]);
  }, [genres, mediaType]);

  const fetchContent = async (targetPage = 1) => {
    try {
      if (!selectedGenre) return { results: [], page: 1, total_pages: 1 };
      
      let data;
      if (mediaType === 'movie') {
        data = await tmdbService.discoverMoviesPage({
          language: contentLanguage,
          page: targetPage,
          with_genres: selectedGenre,
          'with_runtime.lte': maxTime,
          sort_by: 'popularity.desc'
        });
      } else if (mediaType === 'tv') {
        data = await tmdbService.discoverTVPage({
          language: contentLanguage,
          page: targetPage,
          with_genres: selectedGenre,
          'with_runtime.lte': maxTime,
          sort_by: 'popularity.desc'
        });
      } else {
        // Book Mode: We must filter manually because API lacks native `pageCount.lte` query params
        data = await booksService.getTrendingBySubjectPage(selectedGenre, targetPage);
        const maxPages = Math.floor(maxTime * 1.5); // roughly 1.5 pages per minute of reading time
        
        let filtered = data.results.filter(b => {
           if (!b.pageCount) return true; // Keep books with unknown lengths so grid doesn't completely empty out
           return b.pageCount <= maxPages;
        });

        // Boost short books in UI logic
        data.results = filtered;
      }
      return data;
    } catch (err) {
      console.error(err);
      return { results: [], page: 1, total_pages: 1 };
    }
  };

  useEffect(() => {
    let isActive = true;
    const initFetch = async () => {
      if (!selectedGenre) return;
      setLoading(true);
      setIsError(false);
      const data = await fetchContent(1);
      if (!isActive) return;
      setItems(data?.results || []);
      setTotalPages(data?.total_pages || 1);
      setPage(1);
      setLoading(false);
    };
    // Debounce to prevent rapid slider fetching
    const timer = setTimeout(() => {
      initFetch();
    }, 500);
    
    return () => { 
      isActive = false; 
      clearTimeout(timer);
    };
  }, [mediaType, selectedGenre, maxTime, contentLanguage]);

  const loadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    const data = await fetchContent(nextPage);
    setItems(prev => [...prev, ...(data.results || [])]);
    setPage(nextPage);
    setTotalPages(data.total_pages || totalPages);
    setLoadingMore(false);
  };

  return (
    <div className="movies-page container fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: '50%' }}>
          <FiClock size={32} />
        </div>
        <div>
          <div className="label">Time Filter</div>
          <h1 className="page-title" style={{ margin: 0 }}>QuickWatch</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Got some free time? Slide to your available timeframe and find something that fits perfectly.
          </p>
        </div>
      </div>

      <div className="movies-controls" style={{ background: 'var(--surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
        
        {/* MEDIA TYPE */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>What are you looking for?</label>
          <div className="tabs" style={{ display: 'inline-flex' }}>
            <button className={`tab ${mediaType === 'movie' ? 'active' : ''}`} onClick={() => setMediaType('movie')}>
              <FiFilm style={{ marginRight: '0.5rem' }}/> Movies
            </button>
            <button className={`tab ${mediaType === 'tv' ? 'active' : ''}`} onClick={() => setMediaType('tv')}>
              <FiTv style={{ marginRight: '0.5rem' }}/> TV Shows
            </button>
            <button className={`tab ${mediaType === 'book' ? 'active' : ''}`} onClick={() => setMediaType('book')}>
              <FiBook style={{ marginRight: '0.5rem' }}/> Books
            </button>
          </div>
        </div>

        {/* TIME SLIDER */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>
            Maximum {mediaType === 'book' ? 'Reading Time' : 'Running Time'}: <span style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>{formatTime(maxTime)}</span>
            {mediaType === 'book' && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>(~{Math.floor(maxTime * 1.5)} pages)</span>}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>20m</span>
            <input 
              type="range" 
              min="20" 
              max={mediaType === 'book' ? "600" : "240"} 
              step="10"
              value={maxTime} 
              onChange={(e) => setMaxTime(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>{mediaType === 'book' ? '10h+' : '4h'}</span>
          </div>
        </div>

        {/* GENRE */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Preferred Genre</label>
          <select 
            className="filter-select" 
            style={{ width: '100%', maxWidth: '300px' }}
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULTS */}
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Found {items.length} perfect matches <FiClock color="var(--primary)" />
      </h2>

      {loading ? (
        <div className="grid grid-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : isError ? (
        <div className="empty-state">⚠️ Failed to load content</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
           <div className="empty-state-icon">⏳</div>
           <h3>No content found</h3>
           <p>Try extending your timeframe or selecting a different genre.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-4">
            {items.map((item, i) => (
              <MediaCard 
                key={`${item.id}-${i}`} 
                item={item} 
                type={mediaType} 
              />
            ))}
          </div>

          {page < totalPages && (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <button 
                className="btn btn-primary btn-lg" 
                onClick={loadMore} 
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading ...' : 'Load More Matches'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
