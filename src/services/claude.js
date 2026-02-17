// src/services/claude.js
// Claude API for AI-powered recommendations
// Get your free API key at: https://console.anthropic.com

export const claudeService = {
  async getRecommendations({ liked, mood, genre, type = 'all' }) {
    const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;

    if (!apiKey || apiKey === 'your_claude_api_key_here') {
      // Return mock recommendations if no API key set
      return claudeService.getMockRecommendations({ liked, mood, genre, type });
    }

    const typeLabel =
      type === 'movies' ? 'movies and TV shows'
      : type === 'books' ? 'books'
      : 'movies, TV shows, and books';

    const prompt = `You are an expert entertainment curator. Based on the user's preferences, recommend ${typeLabel}.

User's favorite titles: ${liked?.join(', ') || 'not specified'}
Mood/feeling they want: ${mood || 'not specified'}
Preferred genre: ${genre || 'any'}
Content type requested: ${typeLabel}

Please provide exactly 8 personalized recommendations. Return ONLY a JSON array with no extra text.
Each item should have these fields:
{
  "title": "Title Here",
  "type": "movie" | "tv" | "book",
  "reason": "One sentence why this matches their taste",
  "mood": "The mood/vibe of this content",
  "year": "Release/publish year",
  "genre": "Primary genre",
  "author_or_director": "Name of author or director"
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text = data.content?.[0]?.text || '[]';

      // Strip markdown code fences if present
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(clean);
    } catch (err) {
      console.error('Claude API error:', err);
      return claudeService.getMockRecommendations({ liked, mood, genre, type });
    }
  },

  // Fallback mock recommendations when no API key
  getMockRecommendations({ mood, genre, type }) {
    const allRecs = [
      { title: 'Interstellar', type: 'movie', reason: 'Mind-bending sci-fi with emotional depth', mood: 'Epic & Contemplative', year: '2014', genre: 'Sci-Fi', author_or_director: 'Christopher Nolan' },
      { title: 'Dune', type: 'movie', reason: 'Epic world-building meets political intrigue', mood: 'Vast & Immersive', year: '2021', genre: 'Sci-Fi', author_or_director: 'Denis Villeneuve' },
      { title: 'Severance', type: 'tv', reason: 'Unsettling corporate dystopia with brilliant twists', mood: 'Eerie & Compelling', year: '2022', genre: 'Thriller', author_or_director: 'Ben Stiller' },
      { title: 'The Bear', type: 'tv', reason: 'Intense character study in high-pressure kitchen', mood: 'Intense & Authentic', year: '2022', genre: 'Drama', author_or_director: 'Christopher Storer' },
      { title: 'Project Hail Mary', type: 'book', reason: 'Brilliant hard sci-fi with heartwarming alien first contact', mood: 'Optimistic & Thrilling', year: '2021', genre: 'Sci-Fi', author_or_director: 'Andy Weir' },
      { title: 'The Name of the Wind', type: 'book', reason: 'Beautifully written fantasy with unmatched prose', mood: 'Lyrical & Epic', year: '2007', genre: 'Fantasy', author_or_director: 'Patrick Rothfuss' },
      { title: 'Shogun', type: 'tv', reason: 'Spectacular historical drama set in feudal Japan', mood: 'Grand & Dramatic', year: '2024', genre: 'Historical', author_or_director: 'Rachel Kondo' },
      { title: 'The Martian', type: 'movie', reason: 'Witty survival story with compelling problem-solving', mood: 'Hopeful & Tense', year: '2015', genre: 'Sci-Fi', author_or_director: 'Ridley Scott' },
    ];
    return allRecs;
  },
};

export default claudeService;
