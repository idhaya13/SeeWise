// src/services/tmdb.js
// TMDB API Service - Free API, sign up at https://themoviedb.org

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const IMAGE_BASE = process.env.REACT_APP_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY },
});

export const tmdbService = {
  // Get trending movies (daily/weekly)
  getTrending: (timeWindow = 'week') =>
    tmdb.get(`/trending/movie/${timeWindow}`).then((r) => r.data.results),

  // Get trending TV shows
  getTrendingTV: (timeWindow = 'week') =>
    tmdb.get(`/trending/tv/${timeWindow}`).then((r) => r.data.results),

  // Search movies
  searchMovies: (query) =>
    tmdb.get('/search/movie', { params: { query } }).then((r) => r.data.results),

  // Search TV shows
  searchTV: (query) =>
    tmdb.get('/search/tv', { params: { query } }).then((r) => r.data.results),

  // Get movie details (with videos for trailers)
  getMovieDetails: (id) =>
    tmdb.get(`/movie/${id}`, { params: { append_to_response: 'videos,credits,similar' } }).then((r) => r.data),

  // Get TV details
  getTVDetails: (id) =>
    tmdb.get(`/tv/${id}`, { params: { append_to_response: 'videos,credits,similar' } }).then((r) => r.data),

  // Discover movies by genre/mood
  discoverMovies: (params = {}) =>
    tmdb.get('/discover/movie', { params }).then((r) => r.data.results),

  // Get movie genres list
  getGenres: () =>
    tmdb.get('/genre/movie/list').then((r) => r.data.genres),

  // Get popular movies
  getPopular: () =>
    tmdb.get('/movie/popular').then((r) => r.data.results),

  // Get top rated
  getTopRated: () =>
    tmdb.get('/movie/top_rated').then((r) => r.data.results),

  // Get now playing
  getNowPlaying: () =>
    tmdb.get('/movie/now_playing').then((r) => r.data.results),

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
