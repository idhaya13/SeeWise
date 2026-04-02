// src/services/books.js
// Open Library API (FREE, no key needed!) + Google Books API (free tier)
// Open Library docs: https://openlibrary.org/developers/api
// Google Books docs: https://developers.google.com/books

import axios from 'axios';

const OL_BASE = 'https://openlibrary.org';
const GB_BASE = 'https://www.googleapis.com/books/v1';
const GB_API_KEY = process.env.REACT_APP_GOOGLE_BOOKS_API_KEY;

const useOpenLibraryProxy = process.env.REACT_APP_OPENLIBRARY_CORS_PROXY === 'true';

const validGbKey = GB_API_KEY && GB_API_KEY !== 'your_google_books_key_here' ? GB_API_KEY : null;

const gbClient = axios.create({
  baseURL: GB_BASE,
  params: validGbKey ? { key: validGbKey } : {},
});

const OL_CORS_PROXY_FALLBACKS = [
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://api.codetabs.com/v1/proxy?quest=',
];

const openLibraryGet = async (path, params = {}) => {
  const url = new URL(`${OL_BASE}${path}`);
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });

  const directUrl = url.toString();
  const proxyUrls = useOpenLibraryProxy
    ? OL_CORS_PROXY_FALLBACKS.map((proxy) => `${proxy}${encodeURIComponent(directUrl)}`)
    : [];

  // Try each proxy in order, then direct as last resort.
  for (const attemptUrl of [...proxyUrls, directUrl]) {
    try {
      const result = await axios.get(attemptUrl);
      console.debug('OpenLibrary fetch success via', attemptUrl);
      return result;
    } catch (err) {
      console.warn('OpenLibrary fetch failed via', attemptUrl, err.message);
      // If final attempt fails, rethrow.
      if (attemptUrl === directUrl) throw err;
    }
  }
  throw new Error('OpenLibrary fetch failed via all endpoints');
};

// Helper: format Open Library book to unified shape
const formatOLBook = (book) => ({
  id: book.key?.replace('/works/', '') || book.cover_edition_key,
  title: book.title,
  author: book.author_name?.join(', ') || 'Unknown Author',
  cover: book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
    : null,
  coverMedium: book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : null,
  year: book.first_publish_year,
  subjects: book.subject?.slice(0, 5) || [],
  rating: book.ratings_average ? book.ratings_average.toFixed(1) : null,
  ratingCount: book.ratings_count,
  description: book.first_sentence?.value || null,
  olKey: book.key,
  source: 'openlibrary',
});

// Helper: format Google Books to unified shape
const formatGBBook = (item) => {
  const info = item.volumeInfo || {};
  return {
    id: item.id,
    title: info.title,
    author: info.authors?.join(', ') || 'Unknown Author',
    cover: info.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
    coverMedium: info.imageLinks?.smallThumbnail?.replace('http://', 'https://') || null,
    year: info.publishedDate?.substring(0, 4),
    subjects: info.categories || [],
    rating: info.averageRating ? info.averageRating.toFixed(1) : null,
    ratingCount: info.ratingsCount,
    description: info.description,
    pageCount: info.pageCount,
    isbn: info.industryIdentifiers?.[0]?.identifier,
    source: 'google',
  };
};

export const booksService = {
  // Search books via Open Library (no key needed!)
  searchOpenLibrary: async (query) => {
    const res = await openLibraryGet('/search.json', {
      q: query,
      limit: 20,
      fields: 'key,title,author_name,cover_i,first_publish_year,subject,ratings_average,ratings_count,first_sentence',
    });
    return (res.data.docs || []).map(formatOLBook);
  },

  // Search books via Google Books
  searchGoogleBooks: async (query) => {
    const res = await gbClient.get('/volumes', {
      params: { q: query, maxResults: 20, printType: 'books' },
    });
    return (res.data.items || []).map(formatGBBook);
  },

  // Get Open Library book details
  getBookDetails: async (olKey) => {
    const res = await openLibraryGet(`/works/${olKey}.json`);
    const data = res.data;

    // Get author info
    let authorName = 'Unknown Author';
    if (data.authors?.[0]?.author?.key) {
      try {
        const authorRes = await openLibraryGet(`${data.authors[0].author.key}.json`);
        authorName = authorRes.data.name;
      } catch (_) {}
    }

    return {
      id: olKey,
      title: data.title,
      author: authorName,
      description:
        typeof data.description === 'string'
          ? data.description
          : data.description?.value || '',
      subjects: data.subjects?.slice(0, 10) || [],
      cover: data.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
        : null,
      olKey: data.key,
      source: 'openlibrary',
    };
  },

  // Get trending/popular books from Open Library subjects
  getTrendingBySubject: async (subject = 'fiction') => {
    try {
      const res = await openLibraryGet(`/subjects/${subject}.json`, {
        limit: 20,
      });
      return (res.data.works || []).map((w) => ({
        id: w.key?.replace('/works/', ''),
        title: w.title,
        author: w.authors?.[0]?.name || 'Unknown',
        cover: w.cover_id
          ? `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`
          : null,
        coverMedium: w.cover_id
          ? `https://covers.openlibrary.org/b/id/${w.cover_id}-M.jpg`
          : null,
        year: w.first_publish_year,
        olKey: w.key,
        source: 'openlibrary',
      }));
    } catch (olError) {
      console.warn('OpenLibrary subject failed, falling back to Google Books:', olError.message);
      const fallback = await booksService.getPopularByCategory(subject);
      return fallback.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author || 'Unknown',
        cover: book.cover || book.coverMedium || null,
        coverMedium: book.coverMedium || book.cover || null,
        year: book.year || null,
        subjects: book.subjects || [],
        rating: book.rating || null,
        source: 'google',
      }));
    }
  },

  // Get bestsellers / popular lists from Google Books
  getPopularByCategory: async (category = 'fiction') => {
    const res = await gbClient.get('/volumes', {
      params: {
        q: `subject:${category}`,
        orderBy: 'relevance',
        maxResults: 20,
        printType: 'books',
      },
    });
    return (res.data.items || []).map(formatGBBook);
  },

  // Combined search: try both APIs and merge results
  searchBooks: async (query) => {
    try {
      const [olResults, gbResults] = await Promise.allSettled([
        booksService.searchOpenLibrary(query),
        booksService.searchGoogleBooks(query),
      ]);
      const ol = olResults.status === 'fulfilled' ? olResults.value : [];
      const gb = gbResults.status === 'fulfilled' ? gbResults.value : [];
      // Merge, deduplicate by title similarity
      const seen = new Set();
      const merged = [...ol, ...gb].filter((b) => {
        const key = b.title?.toLowerCase().trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return merged;
    } catch (e) {
      console.error('Book search error:', e);
      return [];
    }
  },
};

export default booksService;
