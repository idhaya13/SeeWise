// src/services/tmdb.js
// TMDB API Service - Free API, sign up at https://themoviedb.org

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const IMAGE_BASE = process.env.REACT_APP_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

// Check if API key is available
if (!API_KEY) {
  console.error('TMDB API key is not configured. Please set REACT_APP_TMDB_API_KEY environment variable.');
}

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: API_KEY ? { api_key: API_KEY } : {},
});

const createTmdbError = (error) => {
  const status = error?.response?.status;
  const apiMessage = error?.response?.data?.status_message || error?.message || 'Unknown TMDB error';
  let message;

  if (!API_KEY) {
    message = 'TMDB API key is not configured. Please set REACT_APP_TMDB_API_KEY in your deployment environment.';
  } else if (status === 401) {
    message = 'TMDB authorization failed. Your API key is missing, invalid, or not allowed. Check REACT_APP_TMDB_API_KEY in Vercel or your local .env file.';
  } else {
    message = `TMDB request failed (${status || 'unknown'}). ${apiMessage}`;
  }

  const err = new Error(message);
  err.status = status;
  err.isTmdb = true;
  return err;
};

// Prevent requests without a configured key and normalize errors
if (!API_KEY) {
  console.warn('TMDB API key is not configured. Please set REACT_APP_TMDB_API_KEY environment variable.');
}

tmdb.interceptors.request.use(
  (config) => {
    if (!API_KEY) {
      return Promise.reject(createTmdbError({ response: { status: 401, data: { status_message: 'TMDB API key missing' } } }));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
tmdb.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(createTmdbError(error))
);

export const tmdbService = {
  // Get trending movies (daily/weekly)
  getTrending: (lang = 'en', timeWindow = 'week') => {
    const window = typeof timeWindow === 'string' ? timeWindow : 'week';
    return tmdb.get(`/trending/movie/${window}`, { params: { language: lang } }).then((r) => r.data.results);
  },

  getTrendingPage: (lang = 'en', timeWindow = 'week', page = 1) => {
    const window = typeof timeWindow === 'string' ? timeWindow : 'week';
    return tmdb.get(`/trending/movie/${window}`, { params: { language: lang, page } }).then((r) => r.data);
  },

  // Get trending TV shows
  getTrendingTV: (lang = 'en', timeWindow = 'week') => {
    const window = typeof timeWindow === 'string' ? timeWindow : 'week';
    return tmdb.get(`/trending/tv/${window}`, { params: { language: lang } }).then((r) => r.data.results);
  },

  getTrendingTVPage: (lang = 'en', timeWindow = 'week', page = 1) => {
    const window = typeof timeWindow === 'string' ? timeWindow : 'week';
    return tmdb.get(`/trending/tv/${window}`, { params: { language: lang, page } }).then((r) => r.data);
  },

  // Languages to search across for comprehensive results
  SEARCH_LANGUAGES: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'hi', 'ar', 'th', 'bn', 'tr', 'nl', 'pl', 'uk', 'id', 'vi', 'tl', 'te', 'ta', 'kn', 'ml', 'mr'],

  // Search movies across all popular languages and merge results - show all matches
  searchMovies: async (query) => {
    const searchLanguages = tmdbService.SEARCH_LANGUAGES;
    const results = await Promise.allSettled(
      searchLanguages.map(lang =>
        tmdb.get('/search/movie', { params: { query, language: lang, include_adult: true } }).then((r) => r.data.results)
      )
    );
    
    // Merge results and deduplicate by ID
    const seen = new Set();
    const merged = [];
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        result.value.forEach((movie) => {
          if (!seen.has(movie.id)) {
            seen.add(movie.id);
            merged.push(movie);
          }
        });
      }
    });
    
    // Sort by popularity/rating - return ALL results
    return merged.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  },

  // Search TV shows across all popular languages and merge results - show all matches
  searchTV: async (query) => {
    const searchLanguages = tmdbService.SEARCH_LANGUAGES;
    const results = await Promise.allSettled(
      searchLanguages.map(lang =>
        tmdb.get('/search/tv', { params: { query, language: lang, include_adult: true } }).then((r) => r.data.results)
      )
    );
    
    // Merge results and deduplicate by ID
    const seen = new Set();
    const merged = [];
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        result.value.forEach((show) => {
          if (!seen.has(show.id)) {
            seen.add(show.id);
            merged.push(show);
          }
        });
      }
    });
    
    // Sort by popularity/rating - return ALL results
    return merged.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  },

  // Get movie details
  getMovieDetails: (id, lang = 'en') =>
    tmdb.get(`/movie/${id}`, { params: { append_to_response: 'videos,credits,similar,watch/providers', language: lang } }).then((r) => r.data),

  // Get TV details
  getTVDetails: (id, lang = 'en') =>
    tmdb.get(`/tv/${id}`, { params: { append_to_response: 'videos,credits,similar,watch/providers', language: lang } }).then((r) => r.data),

  // Discover movies
  discoverMovies: (params = {}) =>
    tmdb.get('/discover/movie', { params }).then((r) => r.data.results),

  discoverMoviesPage: (params = {}) =>
    tmdb.get('/discover/movie', { params }).then((r) => r.data),

  // Discover TV shows
  discoverTV: (params = {}) =>
    tmdb.get('/discover/tv', { params }).then((r) => r.data.results),

  discoverTVPage: (params = {}) =>
    tmdb.get('/discover/tv', { params }).then((r) => r.data),

  // Get movie genres list
  getMovieGenres: (lang = 'en') =>
    tmdb.get('/genre/movie/list', { params: { language: lang } }).then((r) => r.data.genres),

  // Get TV genres list
  getTVGenres: (lang = 'en') =>
    tmdb.get('/genre/tv/list', { params: { language: lang } }).then((r) => r.data.genres),

  // Compatibility helper
  getGenres: (lang = 'en') => tmdbService.getMovieGenres(lang),

  // Get popular movies
  getPopular: (lang = 'en') =>
    tmdb.get('/movie/popular', { params: { language: lang } }).then((r) => r.data.results),

  getPopularPage: (lang = 'en', page = 1) =>
    tmdb.get('/movie/popular', { params: { language: lang, page } }).then((r) => r.data),

  // Get top rated
  getTopRated: (lang = 'en') =>
    tmdb.get('/movie/top_rated', { params: { language: lang } }).then((r) => r.data.results),

  getTopRatedPage: (lang = 'en', page = 1) =>
    tmdb.get('/movie/top_rated', { params: { language: lang, page } }).then((r) => r.data),

  // Get now playing
  getNowPlaying: (lang = 'en') =>
    tmdb.get('/movie/now_playing', { params: { language: lang } }).then((r) => r.data.results),

  getNowPlayingPage: (lang = 'en', region = 'US', page = 1) =>
    tmdb.get('/movie/now_playing', { params: { language: lang, region, page } }).then((r) => r.data),

  // Get on the air (TV version of now playing)
  getOnTheAirTV: (lang = 'en') =>
    tmdb.get('/tv/on_the_air', { params: { language: lang } }).then((r) => r.data.results),

  getOnTheAirTVPage: (lang = 'en', page = 1) =>
    tmdb.get('/tv/on_the_air', { params: { language: lang, page } }).then((r) => r.data),

  // Get top rated TV
  getTopRatedTV: (lang = 'en') =>
    tmdb.get('/tv/top_rated', { params: { language: lang } }).then((r) => r.data.results),

  // Get movie recommendations based on a movie ID
  getMovieRecommendations: (id) =>
    tmdb.get(`/movie/${id}/recommendations`).then((r) => r.data.results),

  // Image URL helpers
  getImageUrl: (path, size = 'w500') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null,

  getBackdropUrl: (path, size = 'original') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null,

  // Get YouTube trailer key
  getTrailerKey: (videos) => {
    if (!videos?.results) return null;
    const trailer = videos.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube'
    ) || videos.results[0];
    return trailer?.key || null;
  },
};

export default tmdbService;
