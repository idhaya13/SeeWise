// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiFilm, FiTv, FiBook, FiCompass, FiBookmark, FiSearch, FiX, FiZap, FiChevronDown, FiGlobe, FiPlayCircle, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import './Navbar.css';



const NAV_LINKS = [
  { to: '/', label: 'Home', icon: null },
  { to: '/movies', label: 'Movies', icon: <FiFilm /> },
  { to: '/tv', label: 'TV Shows', icon: <FiTv /> },
  { to: '/now-playing', label: 'In Theaters', icon: <FiPlayCircle /> },
  { to: '/books', label: 'Books', icon: <FiBook /> },
  { to: '/quick-watch', label: 'QuickWatch', icon: <FiClock /> },
  { to: '/discover', label: 'Discover', icon: <FiCompass /> },
  { to: '/my-list', label: 'My List', icon: <FiBookmark /> },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logoutUser } = useStore();

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-icon">🎬</span>
          <span className="logo-text">
            See<span className="logo-accent">Wise</span>
          </span>
        </Link>

        {/* Nav Links */}
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
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, books..."
                className="nav-search-input"
              />
              <button type="button" className="btn btn-icon" onClick={() => setSearchOpen(false)}>
                <FiX />
              </button>
            </form>
          ) : (
            <>
              <button className="btn btn-icon" onClick={() => setSearchOpen(true)} title="Search">
                <FiSearch />
              </button>


              <Link to="/ai-recommend" className="btn btn-primary btn-sm ai-btn">
                <FiZap size={14} />
                AI Pick
              </Link>
              {currentUser ? (
                <button className="btn btn-secondary btn-sm" onClick={logoutUser} style={{ marginLeft: '0.5rem' }}>
                  Logout ({currentUser.username})
                </button>
              ) : (
                <Link to="/login" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>
                  Login
                </Link>
              )}            </>
          )}
        </div>
      </div>
    </nav>
  );
}
