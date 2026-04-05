// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { FiInfo, FiZap, FiTrendingUp, FiBook, FiChevronRight } from 'react-icons/fi';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import tmdbService from '../services/tmdb';
import booksService from '../services/books';
import MediaCard from '../components/MediaCard';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import './Home.css';

const MOODS = ['😊 Feel Good', '😱 Thrilling', '🥺 Emotional', '🤣 Comedy', '🌌 Epic', '🧠 Mind-Bending', '💕 Romance', '👻 Scary'];

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, contentLanguage } = useStore();

  // Check if TMDB API key is configured
  const hasApiKey = !!process.env.REACT_APP_TMDB_API_KEY;

  // Keep core home feed in English by default; regional fetch is done in specific tabs
  const { data: trending = [], error: trendingError } = useQuery(
    ['trending-movies', 'en'],
    () => tmdbService.getTrending('en'),
    { staleTime: 5 * 60 * 1000, enabled: hasApiKey }
  );
  const { data: trendingTV = [], error: trendingTVError } = useQuery(
    ['trending-tv', 'en'],
    () => tmdbService.getTrendingTV('en'),
    { staleTime: 5 * 60 * 1000, enabled: hasApiKey }
  );
  const { data: topRated = [], error: topRatedError } = useQuery(
    ['top-rated', 'en'],
    () => tmdbService.getTopRated('en'),
    { staleTime: 10 * 60 * 1000, enabled: hasApiKey }
  );
  const { data: featuredBooks = [] } = useQuery('featured-books', () => booksService.getTrendingBySubject('fiction'), { staleTime: 10 * 60 * 1000 });
  const { data: scifiBooks = [] } = useQuery('scifi-books', () => booksService.getTrendingBySubject('science-fiction'), { staleTime: 10 * 60 * 1000 });

  const heroMovies = trending.slice(0, 5);
  const hero = heroMovies[heroIndex];

  useEffect(() => {
    if (!heroMovies.length) return;
    const timer = setInterval(() => {
      setHeroLoaded(false);
      setTimeout(() => {
        setHeroIndex((i) => (i + 1) % heroMovies.length);
        setHeroLoaded(true);
      }, 300);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroMovies.length]);

  useEffect(() => {
    if (hero) setTimeout(() => setHeroLoaded(true), 100);
  }, [heroIndex, hero]);

  const tmdbError = trendingError || trendingTVError || topRatedError;
  const apiErrorMessage = !hasApiKey
    ? 'TMDB API key is not configured. Please set REACT_APP_TMDB_API_KEY in your deployment environment.'
    : tmdbError?.message;

  // Show API key or TMDB authorization error if needed
  if (!hasApiKey || tmdbError) {
    return (
      <div className="home-page">
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔑</div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              { !hasApiKey ? 'TMDB API Key Required' : 'TMDB Authorization Error' }
            </h2>
            <p style={{ marginBottom: '2rem' }}>
              {apiErrorMessage}
            </p>
            <Link to="/movies" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              View setup instructions →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* ======================== HERO ======================== */}
      {hero && (
        <section className={`hero home-hero ${heroLoaded ? 'loaded' : ''}`}>
          <div
            className="hero-backdrop"
            style={{
              backgroundImage: `url(${tmdbService.getBackdropUrl(hero.backdrop_path)})`,
            }}
          />
          <div className="hero-gradient" />

          {/* Dots Indicator */}
          <div className="hero-dots">
            {heroMovies.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === heroIndex ? 'active' : ''}`}
                onClick={() => { setHeroLoaded(false); setHeroIndex(i); }}
              />
            ))}
          </div>

          <div className="hero-content">
            <div className="container">
              <div className="hero-inner">
                <div className="label fade-in">🔥 Trending Now</div>
                <h1 className="display-title hero-title fade-in fade-in-1">{hero.title}</h1>
                <p className="hero-overview fade-in fade-in-2">
                  {hero.overview?.substring(0, 180)}{hero.overview?.length > 180 ? '...' : ''}
                </p>

                <div className="hero-meta fade-in fade-in-3">
                  {hero.release_date && (
                    <span className="badge badge-accent">{hero.release_date.substring(0, 4)}</span>
                  )}
                  {hero.vote_average && (
                    <span className="badge badge-gold">⭐ {hero.vote_average.toFixed(1)}</span>
                  )}
                  <span className="badge badge-teal">🎬 Movie</span>
                </div>

                <div className="hero-actions fade-in fade-in-4">
                  <Link to={`/movie/${hero.id}?type=movie`} className="btn btn-primary btn-lg">
                    <FiInfo size={18} /> View Details
                  </Link>
                  <Link to="/ai-recommend" className="btn btn-ghost btn-lg ai-rec-btn">
                    <FiZap />
                    AI Picks
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================== CONTENT ======================== */}
      <div className="home-content container">

        {/* Mood Quick Links */}
        <section className="section fade-in">
          <div className="mood-banner">
            <div className="mood-banner-label">
              <FiZap />
              <span>What's your mood tonight?</span>
            </div>
            <div className="mood-chips">
              {MOODS.map((mood) => (
                <Link
                  key={mood}
                  to={`/ai-recommend?mood=${encodeURIComponent(mood)}`}
                  className="chip"
                >
                  {mood}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Movies */}
        {trending.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title"><FiTrendingUp /> Trending Movies</h2>
              <Link to="/movies" className="see-all">See All <FiChevronRight /></Link>
            </div>
            <div className="scroll-row">
              {trending.slice(0, 12).map((movie) => (
                <MediaCard key={movie.id} item={movie} type="movie" />
              ))}
            </div>
          </section>
        )}

        {/* Trending TV */}
        {trendingTV.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">📺 Trending TV Shows</h2>
              <Link to="/tv" className="see-all">See All <FiChevronRight /></Link>
            </div>
            <div className="scroll-row">
              {trendingTV.slice(0, 12).map((show) => (
                <MediaCard key={show.id} item={show} type="tv" />
              ))}
            </div>
          </section>
        )}

        {/* Featured Books */}
        {featuredBooks.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title"><FiBook /> Popular Fiction</h2>
              <Link to="/books" className="see-all">See All <FiChevronRight /></Link>
            </div>
            <div className="scroll-row">
              {featuredBooks.slice(0, 12).map((book) => (
                <MediaCard key={book.id} item={book} type="book" />
              ))}
            </div>
          </section>
        )}

        {/* Top Rated Movies */}
        {topRated.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">⭐ Top Rated Movies</h2>
              <Link to="/movies?tab=top" className="see-all">See All <FiChevronRight /></Link>
            </div>
            <div className="grid grid-4">
              {topRated.slice(0, 8).map((movie) => (
                <MediaCard key={movie.id} item={movie} type="movie" />
              ))}
            </div>
          </section>
        )}

        {/* Sci-Fi Books */}
        {scifiBooks.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">🚀 Sci-Fi Books</h2>
              <Link to="/books?genre=science-fiction" className="see-all">See All <FiChevronRight /></Link>
            </div>
            <div className="scroll-row">
              {scifiBooks.slice(0, 12).map((book) => (
                <MediaCard key={book.id} item={book} type="book" />
              ))}
            </div>
          </section>
        )}

        {/* AI CTA Banner */}
        <section className="section">
          <div className="ai-cta-banner">
            <div className="ai-cta-glow" />
            <div className="ai-cta-content">
              <div className="ai-cta-icon">✨</div>
              <div>
                <h3>Can't decide what to watch or read?</h3>
                <p>Tell our AI what you're in the mood for and get personalized recommendations for movies, TV shows, and books.</p>
              </div>
              <Link to="/ai-recommend" className="btn btn-primary btn-lg">
                <FiZap /> Get AI Recommendations
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
