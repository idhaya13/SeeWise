// src/pages/Books.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import booksService from '../services/books';
import MediaCard from '../components/MediaCard';
import { FiSearch } from 'react-icons/fi';
import './Movies.css';
import './Books.css';

const BOOK_SUBJECTS = [
  { key: 'fiction', label: '📖 Fiction' },
  { key: 'mystery', label: '🔍 Mystery' },
  { key: 'science-fiction', label: '🚀 Sci-Fi' },
  { key: 'fantasy', label: '🐉 Fantasy' },
  { key: 'romance', label: '💕 Romance' },
  { key: 'thriller', label: '⚡ Thriller' },
  { key: 'biography', label: '👤 Biography' },
  { key: 'history', label: '🏛️ History' },
];

export default function Books() {
  const [searchParams] = useSearchParams();
  const genreParam = searchParams.get('genre') || 'fiction';
  const [activeSubject, setActiveSubject] = useState(genreParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: subjectBooks = [],
    isLoading,
    isError: isSubjectError,
    error: subjectError,
  } = useQuery(
    ['books-subject', activeSubject],
    () => booksService.getTrendingBySubject(activeSubject),
    { staleTime: 10 * 60 * 1000 }
  );

  const {
    data: searchResults = [],
    isLoading: searching,
    isError: isSearchError,
    error: searchError,
  } = useQuery(
    ['books-search', searchTerm],
    () => booksService.searchBooks(searchTerm),
    { enabled: !!searchTerm, staleTime: 5 * 60 * 1000 }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchTerm(searchQuery.trim());
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
  };

  const displayBooks = searchTerm ? searchResults : subjectBooks;
  const isLoading2 = searchTerm ? searching : isLoading;

  return (
    <div className="movies-page books-page container">
      <div className="page-header">
        <div>
          <div className="label">Explore</div>
          <h1 className="page-title">📚 Books</h1>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="books-search-bar">
        <div className="search-wrapper" style={{ flex: 1, maxWidth: 500 }}>
          <span className="search-icon"><FiSearch /></span>
          <input
            type="text"
            className="search-input"
            placeholder="Search books, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">Search</button>
        {searchTerm && (
          <button type="button" className="btn btn-secondary" onClick={clearSearch}>
            Clear
          </button>
        )}
      </form>

      {/* Tabs - only show when not searching */}
      {!searchTerm && (
        <div className="movies-controls">
          <div className="tabs" style={{ flexWrap: 'wrap', height: 'auto', padding: '0.5rem', gap: '0.25rem', borderRadius: 'var(--radius)' }}>
            {BOOK_SUBJECTS.map((s) => (
              <button
                key={s.key}
                className={`tab ${activeSubject === s.key ? 'active' : ''}`}
                onClick={() => setActiveSubject(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search results header */}
      {searchTerm && (
        <div className="search-results-header">
          <p>
            <span className="label">Search results for</span><br />
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>"{searchTerm}"</strong>
          </p>
        </div>
      )}

      {/* Grid */}
      {(isSubjectError || isSearchError) ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <h3>Could not load books right now</h3>
          <p>
            {isSubjectError && `Subject load failed: ${(subjectError?.message || 'Unknown error')}`}
            {isSearchError && `Search failed: ${(searchError?.message || 'Unknown error')}`}
          </p>
          <p>Try again, check your network, or set <code>REACT_APP_OPENLIBRARY_CORS_PROXY=false</code> in .env if you are on a server-side proxy.</p>
        </div>
      ) : isLoading2 ? (
        <div className="grid grid-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : displayBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No books found</h3>
          <p>Try a different search term or browse another genre.</p>
        </div>
      ) : (
        <div className="grid grid-4 fade-in">
          {displayBooks.map((book) => (
            <MediaCard key={book.id} item={book} type="book" />
          ))}
        </div>
      )}

      {/* API Credit */}
      <div className="api-credit">
        <span>📡 Powered by</span>
        <a href="https://openlibrary.org" target="_blank" rel="noreferrer">Open Library</a>
        <span>&</span>
        <a href="https://books.google.com" target="_blank" rel="noreferrer">Google Books</a>
        <span>— Free & Open APIs</span>
      </div>
    </div>
  );
}
