// src/pages/Kids.js
import React, { useState, useEffect } from 'react';
import MediaCard from '../components/MediaCard';
import tmdbService from '../services/tmdb';
import { FiFilm, FiTv } from 'react-icons/fi';
import './Kids.css';

const AGE_GROUPS = {
  toddler: {
    id: 'toddler',
    label: 'Toddlers (0-4)',
    emoji: '🧸',
    movieParams: { certification_country: 'US', 'certification.lte': 'G', with_genres: '10751,16', sort_by: 'popularity.desc' },
    tvParams: { certification_country: 'US', 'certification.lte': 'TV-Y', with_genres: '10751,16', sort_by: 'popularity.desc' },
  },
  kid: {
    id: 'kid',
    label: 'Kids (5-8)',
    emoji: '🎨',
    movieParams: { certification_country: 'US', 'certification.lte': 'PG', with_genres: '10751,16,12', sort_by: 'popularity.desc' },
    tvParams: { certification_country: 'US', 'certification.lte': 'TV-Y7', with_genres: '10751,16', sort_by: 'popularity.desc' },
  },
  older: {
    id: 'older',
    label: 'Older Kids (9-12)',
    emoji: '🚀',
    movieParams: { certification_country: 'US', 'certification.lte': 'PG', with_genres: '10751,12,35,14', sort_by: 'popularity.desc' },
    tvParams: { certification_country: 'US', 'certification.lte': 'TV-PG', with_genres: '10751,16,35', sort_by: 'popularity.desc' },
  }
};

export default function Kids() {
  const [ageGroup, setAgeGroup] = useState('kid');
  const [mediaType, setMediaType] = useState('movie');
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchContent = async (pageNum = 1) => {
    setLoading(true);
    try {
      const activeGroup = AGE_GROUPS[ageGroup];
      const params = mediaType === 'movie' ? activeGroup.movieParams : activeGroup.tvParams;
      
      let data;
      if (mediaType === 'movie') {
        data = await tmdbService.discoverMoviesPage({ ...params, page: pageNum });
      } else {
        data = await tmdbService.discoverTVPage({ ...params, page: pageNum });
      }

      if (data && data.results) {
        if (pageNum === 1) {
          setItems(data.results);
        } else {
          setItems(prev => {
            const newItems = data.results.filter(n => !prev.some(p => p.id === n.id));
            return [...prev, ...newItems];
          });
        }
        setTotalPages(data.total_pages || 1);
      }
    } catch (err) {
      console.error('Kids fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchContent(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageGroup, mediaType]);

  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchContent(nextPage);
    }
  };

  return (
    <div className="kids-page">
      <div className="kids-bg" />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <header className="kids-header">
          <h1 className="kids-title">Kids Zone</h1>
          <p className="kids-subtitle">Safe, fun, and age-appropriate content for everyone!</p>

          <div className="kids-tabs-container">
            {/* Type selector */}
            <div className="kids-type-tabs">
              <button 
                className={`kids-type-tab ${mediaType === 'movie' ? 'active' : ''}`}
                onClick={() => setMediaType('movie')}
              >
                <FiFilm /> Movies
              </button>
              <button 
                className={`kids-type-tab ${mediaType === 'tv' ? 'active' : ''}`}
                onClick={() => setMediaType('tv')}
              >
                <FiTv /> TV Shows
              </button>
            </div>

            {/* Age selector */}
            <div className="kids-age-tabs">
              {Object.values(AGE_GROUPS).map(group => (
                <button
                  key={group.id}
                  className={`kids-age-tab ${group.id} ${ageGroup === group.id ? 'active' : ''}`}
                  onClick={() => setAgeGroup(group.id)}
                >
                  <span className="age-emoji">{group.emoji}</span>
                  {group.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {items.length > 0 ? (
          <div className="grid grid-4">
            {items.map(item => (
              <MediaCard key={`${mediaType}-${item.id}`} item={item} type={mediaType} />
            ))}
          </div>
        ) : !loading && (
          <div className="empty-state">No content found for this category.</div>
        )}

        {loading && (
          <div className="kids-loading">
            <div className="loading-spinner-large" />
            <p>Finding magical stories...</p>
          </div>
        )}

        {items.length > 0 && !loading && page < totalPages && (
          <div className="kids-load-more">
            <button className="kids-load-btn" onClick={loadMore}>
              Load More Magic ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
