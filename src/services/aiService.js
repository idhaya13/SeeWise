// src/services/aiService.js
// AI Service for recommendations (Gemma 3 via Google Gemini API)
// Using Gemini API infrastructure to avoid CORS issues on Hugging Face direct calls.

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-4b-it:generateContent';

export const aiService = {
    async getRecommendations({ liked, userSavedMovies = [], userSavedBooks = [], userRatings = {}, mood, genre, type = 'all', language = 'en' }) {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        console.log('--- AI Recommend Request (Gemma 3 via Gemini API) ---');
        console.log('Type:', type);
        console.log('Mood:', mood);
        console.log('Liked:', liked);
        console.log('API Key Present:', !!apiKey);

        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            console.error('CRITICAL: Gemini API key is missing for Gemma 3!');
            return aiService.getMockRecommendations({ liked, mood, genre, type });
        }

        const prompt = aiService.generatePrompt({ liked, userSavedMovies, userSavedBooks, mood, genre, type, language });

        try {
            const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const msg = errorData.error?.message || 'Gemini API/Gemma error';
                console.error(`Gemma API Error (${response.status}):`, msg);
                throw new Error(msg);
            }

            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
            console.log('RAW AI RESPONSE:', rawText);

            // Extract JSON from response (Gemma IT might wrap it or add markers)
            const startIdx = rawText.indexOf('[');
            const endIdx = rawText.lastIndexOf(']');

            if (startIdx === -1 || endIdx === -1) {
                console.error('No JSON array found in response:', rawText);
                throw new Error('AI failed to return a valid JSON list');
            }

            const cleanText = rawText.substring(startIdx, endIdx + 1);

            try {
                const parsed = JSON.parse(cleanText);

                // Strict filtering for type safety
                const filtered = parsed.filter(item => {
                    if (type === 'movies' && item.type !== 'movie') return false;
                    if (type === 'tv' && item.type !== 'tv') return false;
                    if (type === 'books' && item.type !== 'book') return false;
                    return true;
                });

                console.log(`Filtered ${parsed.length} results down to ${filtered.length} based on type: ${type}`);
                return filtered.slice(0, 8);
            } catch (parseErr) {
                console.error('JSON Parse Error:', parseErr, 'Clean Text:', cleanText);
                throw new Error('AI returned invalid JSON structure');
            }
        } catch (err) {
            console.error('AI Service Error:', err.message);
            // Fallback to mock for certain errors, otherwise re-throw to UI
            if (err.message.includes('API key') || err.message.includes('403')) {
                return aiService.getMockRecommendations({ liked, mood, genre, type, language });
            }
            throw err;
        }
    },

    generatePrompt({ liked, userSavedMovies = [], userSavedBooks = [], userRatings = {}, mood, genre, type, language }) {
        const typeLabel =
            type === 'movies' ? 'movies'
                : type === 'tv' ? 'TV shows'
                    : type === 'books' ? 'books'
                        : 'movies, TV shows, and books';

        let typeConstraint = '';
        if (type === 'movies') {
            typeConstraint = 'ONLY recommend movies. NO TV SHOWS OR BOOKS.';
        } else if (type === 'tv') {
            typeConstraint = 'ONLY recommend TV shows. NO MOVIES OR BOOKS.';
        } else if (type === 'books') {
            typeConstraint = 'ONLY recommend books. NO MOVIES OR TV SHOWS.';
        }

        const languageMap = {
            'hi': 'Hindi',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ja': 'Japanese',
            'ko': 'Korean',
            'te': 'Telugu',
            'ta': 'Tamil',
            'ml': 'Malayalam',
            'kn': 'Kannada',
            'mr': 'Marathi',
            'en': 'English'
        };
        const targetLang = languageMap[language] || 'English';

        return `System: You are an expert curator. Return exactly 8 recommendations in a JSON array.
Language: Preferred content language is ${targetLang}. All titles, reasons, and genres MUST be in ${targetLang}. NEVER use another language.

User Curated Favorites (Movies): ${userSavedMovies.length ? userSavedMovies.join(', ') : 'None'}
User Curated Favorites (Books): ${userSavedBooks.length ? userSavedBooks.join(', ') : 'None'}
User Ratings: ${Object.keys(userRatings).length ? Object.entries(userRatings).map(([title, rating]) => `${title}:${rating}/5`).join(', ') : 'None'}
Liked Titles: ${liked?.join(', ') || 'None'}
Vibe needed: ${mood || 'Exciting'}
Content Type: ${typeLabel}
Strict Rule: ${typeConstraint}

Guideline: Prioritize items NOT already in user saved titles; choose related works based on genres, styles, story arcs from their saved list.

Required JSON structure (NO OTHER TEXT):
[
  {
    "title": "Title Name",
    "type": "movie|tv|book",
    "reason": "One punchy sentence in ${targetLang}",
    "mood": "One word vibe in ${targetLang}",
    "year": "YYYY",
    "genre": "Main Genre in ${targetLang}",
    "author_or_director": "Name"
  }
]
Output ONLY the JSON. No markdown fences.`;
    },

    getMockRecommendations({ mood, genre, type }) {
        console.log('FALLBACK: Using Mock Recommendations');
        const allRecs = [
            { title: 'Interstellar', type: 'movie', reason: 'Mind-bending sci-fi with emotional depth', mood: 'Epic', year: '2014', genre: 'Sci-Fi', author_or_director: 'Christopher Nolan' },
            { title: 'The Bear', type: 'tv', reason: 'Intense character study in high-pressure kitchen', mood: 'Intense', year: '2022', genre: 'Drama', author_or_director: 'Christopher Storer' },
            { title: 'Project Hail Mary', type: 'book', reason: 'Brilliant hard sci-fi with heartwarming alien contact', mood: 'Hopeful', year: '2021', genre: 'Sci-Fi', author_or_director: 'Andy Weir' },
            { title: 'Severance', type: 'tv', reason: 'Unsettling corporate mystery with brilliant twists', mood: 'Eerie', year: '2022', genre: 'Thriller', author_or_director: 'Ben Stiller' },
        ];

        return allRecs.filter(item => {
            if (type === 'movies' && item.type !== 'movie') return false;
            if (type === 'tv' && item.type !== 'tv') return false;
            if (type === 'books' && item.type !== 'book') return false;
            return true;
        }).slice(0, 8);
    },
};

export default aiService;
