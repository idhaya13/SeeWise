// src/services/omdb.js
import axios from 'axios';

const API_KEY = process.env.REACT_APP_OMDB_API_KEY || '1365c5b6';
const BASE_URL = 'https://www.omdbapi.com';

const omdb = axios.create({
  baseURL: BASE_URL,
  params: { apikey: API_KEY },
});

const languageMap = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  mr: 'Marathi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
};

const seeds = {
  hi: ['Dangal', 'RRR', 'Pathaan', 'Brahmastra', 'Dunki', 'Gadar'],
  ta: ['Vikram', 'Jailer', 'Kantara', 'With Love', 'Youth', 'Thaaikae'],
  te: ['Pushpa', 'RRR', 'Kantara', 'Rangasthalam', 'Ala Vaikunthapurramuloo'],
  ml: ['Jai Bhim', 'Drishyam', 'Minnal Murali', 'Bangalore Days', 'Lucifer'],
  kn: ['KGF', 'Ugramm', 'Kantara', 'Rickshawkaran', 'Tagaru'],
  mr: ['Sairat', 'Natsamrat', 'Court', 'Fandry', 'Harishchandrachi Factory'],
};

const omdbService = {
  searchMovies: async (query) => {
    if (!query) return [];
    const { data } = await omdb.get('/', { params: { s: query, type: 'movie' } });
    if (data.Response === 'False') return [];
    return data.Search || [];
  },

  getMovieById: async (id) => {
    if (!id) return null;
    const { data } = await omdb.get('/', { params: { i: id, plot: 'short' } });
    return data.Response === 'False' ? null : data;
  },

  getMoviesByTitle: async (title) => {
    if (!title) return null;
    const { data } = await omdb.get('/', { params: { t: title, plot: 'short' } });
    return data.Response === 'False' ? null : data;
  },

  getRegionalMovies: async (langCode) => {
    const langName = languageMap[langCode] || 'English';
    const titleSeeds = seeds[langCode] || [];

    const results = [];

    for (const seed of titleSeeds) {
      const movie = await omdbService.getMoviesByTitle(seed);
      if (!movie) continue;
      if (!movie.Language || !movie.Language.toLowerCase().includes(langName.toLowerCase())) continue;

      results.push({
        id: movie.imdbID,
        imdbID: movie.imdbID,
        title: movie.Title,
        name: movie.Title,
        poster_path: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : null,
        Poster: movie.Poster,
        release_date: movie.Year ? `${movie.Year}-01-01` : '',
        vote_average: movie.imdbRating && movie.imdbRating !== 'N/A' ? parseFloat(movie.imdbRating) : null,
        original_language: langCode,
        omdb: movie,
      });
    }

    return results;
  },
};

export default omdbService;
