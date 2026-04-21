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
            'hi': 'Hindi', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'ja': 'Japanese', 'ko': 'Korean', 'te': 'Telugu', 'ta': 'Tamil',
            'ml': 'Malayalam', 'kn': 'Kannada', 'mr': 'Marathi', 'en': 'English'
        };
        const targetLang = languageMap[language] || 'English';

        return `System: You are an expert curator. Return exactly 8 recommendations in a JSON array.
Language & Region Hint: The user is interested in ${targetLang} language content. You should prioritize recommending ${targetLang} movies, TV shows, and books. However, ALL of your textual output (titles, reasons, genres, moods) MUST be written entirely in English. Do NOT translate your JSON output into ${targetLang}.

User Curated Favorites (Movies): ${userSavedMovies.length ? userSavedMovies.join(', ') : 'None'}
User Curated Favorites (Books): ${userSavedBooks.length ? userSavedBooks.join(', ') : 'None'}
User Ratings: ${Object.keys(userRatings).length ? Object.entries(userRatings).map(([title, rating]) => `${title}:${rating}/5`).join(', ') : 'None'}
Liked Titles: ${liked?.join(', ') || 'None'}
Vibe needed: ${mood || 'Exciting'}
Content Type: ${typeLabel}
Strict Rule: ${typeConstraint}

Guideline: It is CRITICAL that your recommendations closely match the user's "Vibe needed". You MUST recommend works that share highly similar themes, styles, plot attributes, or genres to the "Liked Titles" and "User Curated Favorites". Do NOT recommend any items already in the user's saved lists.

Required JSON structure (NO OTHER TEXT):
[
  {
    "title": "Title Name",
    "type": "movie|tv|book",
    "reason": "One punchy sentence in English",
    "mood": "One word vibe in English",
    "year": "YYYY",
    "genre": "Main Genre in English",
    "author_or_director": "Name"
  }
]
Output ONLY the JSON. No markdown fences.`;
    },

    async getForYouRecommendations({ profileContext, sectionFlavor, language = 'en' }) {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return aiService.getMockRecommendations({ mood: 'For You', type: 'all' });
        }

        const prompt = aiService.generateForYouPrompt({ profileContext, sectionFlavor, language });

        try {
            const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.75, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
                }),
            });

            if (!response.ok) throw new Error('Gemini API Error');
            const data = await response.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
            const startIdx = rawText.indexOf('[');
            const endIdx = rawText.lastIndexOf(']');
            if (startIdx === -1 || endIdx === -1) throw new Error('Invalid JSON array');
            const cleanText = rawText.substring(startIdx, endIdx + 1);
            
            const parsed = JSON.parse(cleanText);
            return parsed.slice(0, 6); // Top 6 for dashboard blocks
        } catch (err) {
            console.error('ForYou AI Error:', err.message);
            return aiService.getMockRecommendations({ mood: 'For You', type: 'all' }).slice(0, 6);
        }
    },

    generateForYouPrompt({ profileContext, sectionFlavor, language }) {
        const languageMap = {
            'hi': 'Hindi', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'ja': 'Japanese', 'ko': 'Korean', 'te': 'Telugu', 'ta': 'Tamil',
            'ml': 'Malayalam', 'kn': 'Kannada', 'mr': 'Marathi', 'en': 'English'
        };
        const targetLang = languageMap[language] || 'English';

        return `System: You are an elite content curation algorithm. Return exactly 6 outstanding recommendations in a strict JSON array.
Language & Region: Target ${targetLang} movies, TV shows, or books (but return output text in English).

User Profile Snapshot:
- Highly Rated by User: ${profileContext.topRated?.join(', ') || 'None yet'}
- Saved/Bookmarked: ${profileContext.savedItems?.join(', ') || 'None yet'}
- Recently Highlighted/Searched: ${profileContext.aiHistory?.join(', ') || 'None yet'}

Goal Selection Strategy:
${sectionFlavor === 'gems' ? 'Strictly find EXTREMELY obscure, underground, or highly overlooked works. absolutely NO mainstream or popular titles (e.g., no Breaking Bad, no Interstellar, no widely known bestsellers). These MUST be true hidden gems with very low general awareness but exceptionally high quality.' : 
 sectionFlavor === 'similar' ? 'Pick the most highly recognizable and prestigious similar works they MUST experience next.' : 
 'Provide a perfectly balanced, top-tier general recommendation list crossing movies, TV, and books.'}

Rules:
- DO NOT recommend anything already mentioned in their Profile Snapshot!
- DO NOT hallucinate works. Only use real acclaimed works.

Required JSON structure (NO OTHER TEXT, just raw JSON array of objects):
[
  {
    "title": "Title Name",
    "type": "movie" | "tv" | "book",
    "reason": "One brilliant sentence explaining exactly WHY this matches their specific history",
    "mood": "One vibe word",
    "year": "YYYY",
    "genre": "Genre",
    "author_or_director": "Creator Name"
  }
]`;
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
