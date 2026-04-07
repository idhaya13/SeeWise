// src/pages/Books.js
import React, { useState, useEffect } from 'react';
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

  const [page, setPage] = useState(1);

  // Reset page when subject or search changes
  useEffect(() => {
    setPage(1);
  }, [activeSubject, searchTerm]);

  const {
    data: subjectData = { results: [], total_pages: 1 },
    isLoading: isSubjectLoading,
  } = useQuery(
    ['books-subject', activeSubject, page],
    () => booksService.getTrendingBySubjectPage(activeSubject, page),
    { keepPreviousData: true, staleTime: 10 * 60 * 1000 }
  );

  const {
    data: searchData = { results: [], total_pages: 1 },
    isLoading: searching,
  } = useQuery(
    ['books-search', searchTerm, page],
    () => booksService.searchBooksPage(searchTerm, page),
    { enabled: !!searchTerm, keepPreviousData: true, staleTime: 5 * 60 * 1000 }
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

  const displayBooks = searchTerm ? searchData.results : subjectData.results;
  const totalPages = searchTerm ? searchData.total_pages : subjectData.total_pages;
  const isLoading2 = searchTerm ? searching : isSubjectLoading;

  const getPageList = () => {
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, idx) => start + idx);
  };

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
      {isLoading2 ? (
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
        <>
          <div className="grid grid-4 card-row-scroll fade-in">
            {displayBooks.map((book) => (
              <MediaCard key={book.id || book.olKey} item={book} type="book" />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls" style={{ marginTop: '2rem', textAlign: 'center' }}>
              <div className="page-nav" style={{ display: 'inline-flex', gap: '0.25rem', justifyContent: 'center', overflowX: 'auto', maxWidth: '100%' }}>
                <button 
                  className="btn btn-secondary" 
                  disabled={page <= 1 || isLoading2} 
                  onClick={() => setPage(page - 1)}
                >
                  Prev
                </button>
                {getPageList().map((pageNumber) => (
                  <button
                    key={pageNumber}
                    className={`btn ${page === pageNumber ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={page === pageNumber || isLoading2}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                {totalPages > getPageList().length && page < totalPages - 2 && (
                  <span className="dot-spacer" style={{ alignSelf: 'center', padding: '0 0.5rem' }}>...</span>
                )}
                <button 
                  className="btn btn-secondary" 
                  disabled={page >= totalPages || isLoading2} 
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
              <div style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Page {page} / {totalPages}
              </div>
            </div>
          )}
        </>
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
