// src/pages/Movies.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { FiFilter } from 'react-icons/fi';
import tmdbService from '../services/tmdb';
import MediaCard from '../components/MediaCard';
import './Movies.css';

const MOVIE_TABS = [
  { key: 'trending', label: '🔥 Trending' },
  { key: 'top', label: '⭐ Top Rated' },
  { key: 'now', label: '🎬 Now Playing' },
  { key: 'tv', label: '📺 TV Shows' },
];

const GENRES = [
  { id: 28, name: 'Action' }, { id: 35, name: 'Comedy' }, { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' }, { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' },
  { id: 10749, name: 'Romance' }, { id: 16, name: 'Animation' }, { id: 99, name: 'Documentary' },
  { id: 14, name: 'Fantasy' }, { id: 12, name: 'Adventure' }, { id: 80, name: 'Crime' },
];

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'trending');
  const [selectedGenre, setSelectedGenre] = useState(null);

  const handleTab = (key) => {
    setActiveTab(key);
    setSelectedGenre(null);
    setSearchParams({ tab: key });
  };

  const { data: trendingMovies = [], isLoading: l1 } = useQuery('trending', tmdbService.getTrending, { enabled: activeTab === 'trending' });
  const { data: topRated = [], isLoading: l2 } = useQuery('top-rated-m', tmdbService.getTopRated, { enabled: activeTab === 'top' });
  const { data: nowPlaying = [], isLoading: l3 } = useQuery('now-playing', tmdbService.getNowPlaying, { enabled: activeTab === 'now' });
  const { data: trendingTV = [], isLoading: l4 } = useQuery('trending-tv-page', tmdbService.getTrendingTV, { enabled: activeTab === 'tv' });
  const { data: byGenre = [], isLoading: l5 } = useQuery(
    ['by-genre', selectedGenre],
    () => tmdbService.discoverMovies({ with_genres: selectedGenre }),
    { enabled: !!selectedGenre }
  );

  const getItems = () => {
    if (selectedGenre) return { items: byGenre, loading: l5, type: 'movie' };
    if (activeTab === 'trending') return { items: trendingMovies, loading: l1, type: 'movie' };
    if (activeTab === 'top') return { items: topRated, loading: l2, type: 'movie' };
    if (activeTab === 'now') return { items: nowPlaying, loading: l3, type: 'movie' };
    if (activeTab === 'tv') return { items: trendingTV, loading: l4, type: 'tv' };
    return { items: [], loading: false, type: 'movie' };
  };

  const { items, loading, type } = getItems();

  return (
    <div className="movies-page container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label">Browse</div>
          <h1 className="page-title">Movies &amp; TV Shows</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="movies-controls">
        <div className="tabs">
          {MOVIE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key && !selectedGenre ? 'active' : ''}`}
              onClick={() => handleTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Genre Filter */}
        <div className="genre-filter">
          <span className="genre-filter-label"><FiFilter size={14} /> Genre:</span>
          <div className="chip-group">
            {GENRES.map((g) => (
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

      {/* Grid */}
      {loading ? (
        <div className="grid grid-4">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-4 fade-in">
          {items.map((item) => (
            <MediaCard key={item.id} item={item} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}
