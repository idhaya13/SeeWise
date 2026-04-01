// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiFilm, FiTv, FiBook, FiCompass, FiBookmark, FiSearch, FiX, FiZap, FiChevronDown, FiGlobe } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import './Navbar.css';

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

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: null },
  { to: '/movies', label: 'Movies', icon: <FiFilm /> },
  { to: '/tv', label: 'TV Shows', icon: <FiTv /> },
  { to: '/books', label: 'Books', icon: <FiBook /> },
  { to: '/discover', label: 'Discover', icon: <FiCompass /> },
  { to: '/my-list', label: 'My List', icon: <FiBookmark /> },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, contentLanguage, setContentLanguage, currentUser, logoutUser } = useStore();

  const currentLang = LANGUAGES.find(l => l.code === contentLanguage) || LANGUAGES[0];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setLangOpen(false);
    setQuery('');
  }, [location]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.lang-dropdown')) setLangOpen(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

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

              {/* Language Dropdown */}
              <div className="lang-dropdown">
                <button
                  className={`btn btn-icon lang-trigger ${langOpen ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLangOpen(!langOpen);
                  }}
                  title="Change Language"
                >
                  <span className="lang-flag">{currentLang.flag}</span>
                  <FiChevronDown size={14} className={`chevron ${langOpen ? 'open' : ''}`} />
                </button>

                {langOpen && (
                  <div className="lang-menu">
                    <div className="lang-menu-header">
                      <FiGlobe size={14} /> Select Region
                    </div>
                    <div className="lang-grid">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          className={`lang-option ${contentLanguage === lang.code ? 'active' : ''}`}
                          onClick={() => {
                            setContentLanguage(lang.code);
                            setLangOpen(false);
                          }}
                        >
                          <span className="option-flag">{lang.flag}</span>
                          <span className="option-name">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
