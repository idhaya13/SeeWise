// src/pages/Discover.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiSearch } from 'react-icons/fi';
import tmdbService from '../services/tmdb';
import booksService from '../services/books';
import MediaCard from '../components/MediaCard';
import './Movies.css';
import './Discover.css';

const TABS = [
  { key: 'all', label: '✨ All' },
  { key: 'movies', label: '🎬 Movies' },
  { key: 'tv', label: '📺 TV Shows' },
  { key: 'books', label: '📚 Books' },
];

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(qParam);
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (qParam) {
      setQuery(qParam);
      setSearchTerm(qParam);
    }
  }, [qParam]);

  const { data: movieResults = [], isLoading: moviesLoading } = useQuery(
    ['search-movies', searchTerm],
    () => tmdbService.searchMovies(searchTerm),
    { enabled: !!searchTerm }
  );

  const { data: tvResults = [], isLoading: tvLoading } = useQuery(
    ['search-tv', searchTerm],
    () => tmdbService.searchTV(searchTerm),
    { enabled: !!searchTerm }
  );

  const { data: bookResults = [], isLoading: booksLoading } = useQuery(
    ['search-books', searchTerm],
    () => booksService.searchBooks(searchTerm),
    { enabled: !!searchTerm }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTerm(query.trim());
      setSearchParams({ q: query.trim() });
    }
  };

  const isLoading = moviesLoading || tvLoading || booksLoading;
  const hasResults = movieResults.length > 0 || tvResults.length > 0 || bookResults.length > 0;

  const totalCount = {
    all: movieResults.length + tvResults.length + bookResults.length,
    movies: movieResults.length,
    tv: tvResults.length,
    books: bookResults.length,
  };

  return (
    <div className="discover-page movies-page container">
      <div className="page-header">
        <div>
          <div className="label">Explore Everything</div>
          <h1 className="page-title">Discover</h1>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="discover-search">
        <div className="search-wrapper" style={{ flex: 1 }}>
          <span className="search-icon"><FiSearch /></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search movies, TV shows, books..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ borderRadius: 'var(--radius-sm)' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
          <FiSearch /> Search
        </button>
      </form>

      {searchTerm && (
        <>
          <div className="discover-results-header">
            <p>
              Results for <strong style={{ color: 'var(--accent)' }}>"{searchTerm}"</strong>
              {!isLoading && <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>— {totalCount[filter]} results</span>}
            </p>

            {/* Filter Tabs */}
            <div className="tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`tab ${filter === t.key ? 'active' : ''}`}
                  onClick={() => setFilter(t.key)}
                >
                  {t.label}
                  {!isLoading && <span className="tab-count">({totalCount[t.key]})</span>}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-4">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          ) : !hasResults ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No results found</h3>
              <p>Try different keywords or check the spelling.</p>
            </div>
          ) : (
            <div className="discover-results fade-in">
              {/* Movies */}
              {(filter === 'all' || filter === 'movies') && movieResults.length > 0 && (
                <section>
                  {filter === 'all' && <h2 className="section-title">🎬 Movies</h2>}
                  <div className="grid grid-4">
                    {movieResults.slice(0, filter === 'all' ? 6 : 20).map((m) => (
                      <MediaCard key={m.id} item={m} type="movie" />
                    ))}
                  </div>
                </section>
              )}

              {/* TV */}
              {(filter === 'all' || filter === 'tv') && tvResults.length > 0 && (
                <section>
                  {filter === 'all' && <h2 className="section-title" style={{ marginTop: '2rem' }}>📺 TV Shows</h2>}
                  <div className="grid grid-4">
                    {tvResults.slice(0, filter === 'all' ? 6 : 20).map((m) => (
                      <MediaCard key={m.id} item={m} type="tv" />
                    ))}
                  </div>
                </section>
              )}

              {/* Books */}
              {(filter === 'all' || filter === 'books') && bookResults.length > 0 && (
                <section>
                  {filter === 'all' && <h2 className="section-title" style={{ marginTop: '2rem' }}>📚 Books</h2>}
                  <div className="grid grid-4">
                    {bookResults.slice(0, filter === 'all' ? 6 : 20).map((b) => (
                      <MediaCard key={b.id} item={b} type="book" />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {!searchTerm && (
        <div className="discover-empty">
          <div className="discover-empty-art">
            <span className="discover-circle movie-circle">🎬</span>
            <span className="discover-circle book-circle">📚</span>
            <span className="discover-circle tv-circle">📺</span>
          </div>
          <h3>Search across everything</h3>
          <p>Find movies, TV shows, and books — all in one place</p>
        </div>
      )}
    </div>
  );
}
