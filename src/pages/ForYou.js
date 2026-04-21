import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiStar, FiAward, FiZap } from 'react-icons/fi';
import useStore from '../store/useStore';
import aiService from '../services/aiService';
import tmdbService from '../services/tmdb';
import booksService from '../services/books';
import MediaCard from '../components/MediaCard';
import './ForYou.css';

export default function ForYou() {
  const { currentUser, likedTitles, contentLanguage } = useStore();
  
  const [topPicks, setTopPicks] = useState([]);
  const [gems, setGems] = useState([]);
  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingGems, setLoadingGems] = useState(true);
  
  useEffect(() => {
    let isActive = true;

    // Helper to fetch real posters and IDs for the AI text picks
    const hydrateAIResults = async (results) => {
      const hydratedPromises = results.map(async (r) => {
        let hydrated = {
          id: `ai-${r.title.toLowerCase().replace(/\\s/g, '-')}`,
          title: r.title,
          mediaType: r.type,
          year: r.year,
          overview: r.reason,
          author: r.author_or_director,
          source: 'ai'
        };

        try {
          if (r.type === 'movie') {
            const searchRes = await tmdbService.searchMovies(r.title);
            if (searchRes && searchRes[0]) {
              hydrated.id = searchRes[0].id;
              hydrated.poster_path = searchRes[0].poster_path;
            }
          } else if (r.type === 'tv') {
            const searchRes = await tmdbService.searchTV(r.title);
            if (searchRes && searchRes[0]) {
              hydrated.id = searchRes[0].id;
              hydrated.poster_path = searchRes[0].poster_path;
            }
          } else if (r.type === 'book') {
            const searchRes = await booksService.searchBooks(r.title);
            if (searchRes && searchRes[0]) {
              hydrated.id = searchRes[0].id;
              hydrated.cover = searchRes[0].cover;
            }
          }
        } catch (e) {
          console.warn('Hydration fail:', r.title);
        }
        return hydrated;
      });
      return await Promise.all(hydratedPromises);
    };

    const fetchDashboard = async () => {
      // Build Profile Snapshot
      let topRated = [];
      if (currentUser?.ratings) {
        topRated = Object.keys(currentUser.ratings)
          .filter(id => currentUser.ratings[id] >= 4)
          .slice(0, 10); // ID only, we don't have titles easily without joining, but AI might guess if they are famous IDs? Wait, no! AI doesn't know TMDB IDs.
      }

      // To fix ID issue, we grab titles from Playlists
      let savedItems = [];
      if (currentUser?.playlists) {
        const allItems = currentUser.playlists.flatMap(pl => pl.items);
        savedItems = Array.from(new Set(allItems.map(i => i.title || i.name).filter(Boolean))).slice(0, 15);
      }

      const profileContext = {
        topRated: savedItems.slice(0, 5), // Proxy since we don't store titles in ratings object, relying on saved items for strong signals
        savedItems: savedItems,
        aiHistory: likedTitles,
      };

      if (!profileContext.savedItems.length && !profileContext.aiHistory.length) {
        setLoadingTop(false);
        setLoadingGems(false);
        return; // Needs more data
      }

      // Fetch Top Picks
      try {
        const top = await aiService.getForYouRecommendations({ 
          profileContext, 
          sectionFlavor: 'similar',
          language: contentLanguage?.split('-')[0] || 'en'
        });
        if (isActive) {
          const hydratedTop = await hydrateAIResults(top);
          if (isActive) {
            setTopPicks(hydratedTop);
            setLoadingTop(false);
          }
        }
      } catch (e) {
        console.error(e);
        if (isActive) setLoadingTop(false);
      }

      // Fetch Gems separately after a short delay to prevent rate limit
      setTimeout(async () => {
        try {
          const gemRes = await aiService.getForYouRecommendations({ 
            profileContext, 
            sectionFlavor: 'gems',
            language: contentLanguage?.split('-')[0] || 'en'
          });
          if (isActive) {
            const hydratedGems = await hydrateAIResults(gemRes);
            if (isActive) {
              setGems(hydratedGems);
              setLoadingGems(false);
            }
          }
        } catch (e) {
            if (isActive) setLoadingGems(false);
        }
      }, 1500);

    };

    fetchDashboard();

    return () => { isActive = false; };
  }, [currentUser, likedTitles, contentLanguage]);


  // Uninitialized state
  const hasHistory = (currentUser?.playlists?.some(p => p.items.length > 0)) || likedTitles.length > 0;

  if (!hasHistory) {
    return (
      <div className="foryou-page container fade-in">
        <div className="foryou-header">
           <div className="foryou-header-glow" />
           <div className="foryou-header-content">
             <div className="foryou-icon-badge"><FiHeart size={32} /></div>
             <div>
               <div className="label">Personalized Profile</div>
               <h1 className="foryou-title">For You</h1>
               <p className="foryou-subtitle">Your unique DNA of movies, shows, and books.</p>
             </div>
           </div>
        </div>

        <div className="foryou-empty">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
          <h3>Your profile is a blank canvas</h3>
          <p>We need to learn your tastes! Start saving items to your playlists or liking recommendations in AI Pick to train your personalized dashboard.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/movies" className="btn btn-primary">Browse Media</Link>
            <Link to="/ai-recommend" className="btn btn-secondary"><FiZap /> Try AI Pick</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="foryou-page container fade-in">
      <div className="foryou-header">
         <div className="foryou-header-glow" />
         <div className="foryou-header-content">
           <div className="foryou-icon-badge"><FiHeart size={32} /></div>
           <div>
             <div className="label">Personalized Profile</div>
             <h1 className="foryou-title">For You</h1>
             <p className="foryou-subtitle">Your unique DNA of movies, shows, and books dynamically generated based on your history.</p>
           </div>
         </div>
      </div>

      {/* Top Picks Section */}
      <div className="foryou-section">
        <div className="foryou-section-header">
          <FiStar size={24} color="var(--accent)" />
          <div>
            <h2 className="foryou-section-title">Top Matches</h2>
            <p className="foryou-section-desc">Because you saved titles like {currentUser?.playlists?.[0]?.items?.[0]?.title || likedTitles[0] || 'your recent favorites'}</p>
          </div>
        </div>
        
        {loadingTop ? (
          <div className="rail-loading">
             {[1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-card" style={{ width: 200, flexShrink: 0 }} />)}
          </div>
        ) : (
          <div className="scroll-row fade-in">
            {topPicks.map(item => (
              <MediaCard key={item.id} item={item} type={item.mediaType} />
            ))}
            {topPicks.length === 0 && <p className="foryou-section-desc">Couldn't generate matches right now.</p>}
          </div>
        )}
      </div>

      {/* Hidden Gems Section */}
      <div className="foryou-section fade-in-1">
        <div className="foryou-section-header">
          <FiAward size={24} color="var(--gold)" />
          <div>
            <h2 className="foryou-section-title">Hidden Gems</h2>
            <p className="foryou-section-desc">Critically acclaimed but lesser-known masterpieces tailored to your vibe.</p>
          </div>
        </div>
        
        {loadingGems ? (
          <div className="rail-loading">
             {[1,2,3,4,5].map(i => <div key={i} className="skeleton skeleton-card" style={{ width: 200, flexShrink: 0 }} />)}
          </div>
        ) : (
          <div className="scroll-row fade-in">
            {gems.map(item => (
              <MediaCard key={item.id} item={item} type={item.mediaType} />
            ))}
            {gems.length === 0 && !loadingTop && <p className="foryou-section-desc">Couldn't find hidden gems right now.</p>}
          </div>
        )}
      </div>

    </div>
  );
}
