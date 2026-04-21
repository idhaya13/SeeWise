// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiFilm, FiTv, FiBook, FiBookmark, FiSearch, FiX, FiZap, FiChevronDown, FiGlobe, FiPlayCircle, FiClock, FiUser, FiHeart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import useStore from '../store/useStore';
import tmdbService from '../services/tmdb';
import booksService from '../services/books';
import './Navbar.css';



const NAV_LINKS = [
  { to: '/', label: 'Home', icon: null },
  { to: '/for-you', label: 'For You', icon: <FiHeart /> },
  { to: '/movies', label: 'Movies', icon: <FiFilm /> },
  { to: '/tv', label: 'TV Shows', icon: <FiTv /> },
  { to: '/now-playing', label: 'In Theaters', icon: <FiPlayCircle /> },
  { to: '/kids', label: 'Kids', icon: <span style={{fontSize: '1em'}}>🧸</span> },
  { to: '/books', label: 'Books', icon: <FiBook /> },
  { to: '/quick-watch', label: 'QuickWatch', icon: <FiClock /> },
  { to: '/my-list', label: 'My List', icon: <FiBookmark /> },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logoutUser } = useStore();

  // Search queries for live results - search across all languages with single character support
  const { data: movieResults = [], isLoading: moviesLoading } = useQuery(
    ['navbar-search-movies', query],
    () => tmdbService.searchMovies(query),
    { enabled: !!query, staleTime: 5 * 60 * 1000 }
  );

  const { data: tvResults = [], isLoading: tvLoading } = useQuery(
    ['navbar-search-tv', query],
    () => tmdbService.searchTV(query),
    { enabled: !!query, staleTime: 5 * 60 * 1000 }
  );

  const { data: bookResults = [], isLoading: booksLoading } = useQuery(
    ['navbar-search-books', query],
    () => booksService.searchBooks(query),
    { enabled: !!query, staleTime: 5 * 60 * 1000 }
  );

  const isSearching = moviesLoading || tvLoading || booksLoading;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setQuery('');
  }, [location]);

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
      if (!e.target.closest('.mobile-menu-toggle') && !e.target.closest('.mobile-menu-overlay')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (result, type) => {
    let path = '';
    if (type === 'movie') {
      path = `/movies#${result.id}`;
    } else if (type === 'tv') {
      path = `/tv#${result.id}`;
    } else if (type === 'book') {
      path = `/books#${result.id}`;
    }
    
    if (path) {
      navigate(path);
      setSearchOpen(false);
      setQuery('');
      setShowSearchResults(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery('');
      setShowSearchResults(false);
    }
  };

  // Combine and show more results - no strict limits
  const combinedResults = [
    ...movieResults.slice(0, 8).map(r => ({ ...r, type: 'movie', typeLabel: 'Movie', icon: '🎬' })),
    ...tvResults.slice(0, 8).map(r => ({ ...r, type: 'tv', typeLabel: 'TV Show', icon: '📺' })),
    ...bookResults.slice(0, 8).map(r => ({ ...r, type: 'book', typeLabel: 'Book', icon: '📚' })),
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Brand Group */}
        <div className="nav-brand-group">
          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <div className="hamburger-icon">
              <span></span>
            </div>
          </button>

          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">
              See<span className="logo-accent">Wise</span>
            </span>
          </Link>
        </div>

        {/* Nav Links - Desktop */}
        <ul className="nav-links">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <li key={to}>
              <Link
                to={to}
                className={`nav-link ${location.pathname === to ? 'active' : ''}`}
              >
                {icon && <span className="nav-icon">{icon}</span>}
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className="nav-actions">

          {searchOpen ? (
            <form onSubmit={handleSearch} className="nav-search-form">
              <div className="nav-search-wrapper">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  placeholder="Search movies, shows, books..."
                  className="nav-search-input"
                />
                <button type="button" className="btn btn-icon" onClick={() => { setSearchOpen(false); setShowSearchResults(false); setQuery(''); }}>
                  <FiX />
                </button>

                {/* Live Search Results Dropdown */}
                {showSearchResults && query.length > 0 && (
                  <div className="nav-search-results">
                    {isSearching ? (
                      <div className="search-result-item loading">
                        <span>Searching...</span>
                      </div>
                    ) : combinedResults.length > 0 ? (
                      <>
                        {combinedResults.map((result, idx) => (
                          <button
                            key={`${result.type}-${result.id || idx}`}
                            className="search-result-item"
                            onClick={() => handleSearchResultClick(result, result.type)}
                            type="button"
                          >
                            <span className="result-icon">{result.icon}</span>
                            <div className="result-info">
                              <div className="result-title">{result.title || result.name}</div>
                              <div className="result-type">{result.typeLabel}</div>
                            </div>
                          </button>
                        ))}
                        <button
                          className="search-result-item view-all"
                          onClick={handleSearch}
                          type="button"
                        >
                          <span>View all results →</span>
                        </button>
                      </>
                    ) : (
                      <div className="search-result-item no-results">
                        <span>No results found</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>
          ) : (
            <button className="btn btn-icon" onClick={() => setSearchOpen(true)} title="Search">
              <FiSearch />
            </button>
          )}

          <Link to="/ai-recommend" className="btn btn-primary btn-sm ai-btn">
            <FiZap size={14} />
            <span className="btn-label">AI Pick</span>
          </Link>
              {currentUser ? (
                <div className="user-menu">
                  <button 
                    className="btn btn-secondary btn-sm user-menu-trigger" 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    title={`Logged in as ${currentUser.username}`}
                  >
                    <FiUser size={14} />
                    <FiChevronDown size={12} className={`chevron ${userMenuOpen ? 'open' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="user-menu-dropdown">
                      <div className="user-info">
                        <FiUser size={16} />
                        <span>{currentUser.username}</span>
                      </div>
                      <button className="user-menu-item" onClick={logoutUser}>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Login
                </Link>
              )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu">
          <nav className="mobile-nav-links">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`mobile-nav-link ${location.pathname === to ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {icon && <span className="mobile-nav-icon">{icon}</span>}
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </nav>
  );
}
