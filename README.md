# 🎬📚 SeeWise — AI-Powered Movie & Book Recommendations

> Discover your next obsession. Inspired by WatchNow AI, built for both films and books.

![SeeWise Screenshot](https://placeholder.co/1200x600/0a0a0f/c084fc?text=SeeWise)

---

## ✨ Features

- **🤖 AI Recommendations** — Claude AI curates personalized picks based on your taste & mood
- **🎬 Movies & TV Shows** — Browse trending, top-rated, now-playing content via TMDB
- **📚 Books** — Explore fiction, sci-fi, romance & more via Open Library + Google Books
- **🔍 Universal Search** — Search everything in one place
- **📑 Watchlist & Reading List** — Save favorites with persistent local storage
- **🎭 Mood Selector** — Pick your vibe, let AI do the rest
- **📺 Trailer Player** — Watch YouTube trailers in-app
- **📱 Fully Responsive** — Mobile-first design

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/flickbook.git
cd flickbook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your API keys (all FREE — see below 👇).

### 4. Run the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 Free API Keys — Where to Get Them

All APIs used in SeeWise are **completely free**. Here's exactly where to get each one:

---

### 1. 🎬 TMDB (The Movie Database) — Movie & TV Data
**Cost:** 100% Free, no credit card needed  
**Limits:** 40 requests/10 seconds, no monthly cap

**Steps:**
1. Go to → [https://www.themoviedb.org/signup](https://www.themoviedb.org/signup)
2. Create a free account
3. Go to **Settings → API** in your profile
4. Click **"Request an API Key"** → select "Developer"
5. Fill in the form (put "personal project" for company)
6. Copy your **API Key (v3 auth)**
7. Paste into `.env` as `REACT_APP_TMDB_API_KEY`

**What you get:**
- 1.2M+ movies and TV shows
- Posters, backdrops, trailers
- Cast, crew, genres, ratings
- Trending, popular, now playing

---

### 2. 📚 Open Library — Books API
**Cost:** 100% Free, NO API key required!  
**Limits:** Generous rate limits, open access

**Steps:**
1. Nothing! Just leave `REACT_APP_OPEN_LIBRARY_BASE=https://openlibrary.org` in your `.env`
2. That's it — it works out of the box ✅

**What you get:**
- Millions of books
- Cover images
- Author info, descriptions
- Subject browsing (fiction, sci-fi, etc.)

**Docs:** [https://openlibrary.org/developers/api](https://openlibrary.org/developers/api)

---

### 3. 📖 Google Books API — Additional Book Data
**Cost:** Free (1,000 requests/day without key, 1M/day with free key)  
**Limits:** Very generous free tier

**Steps (optional but recommended):**
1. Go to → [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (free, just needs a Google account)
3. Go to **APIs & Services → Library**
4. Search for **"Books API"** and click Enable
5. Go to **APIs & Services → Credentials**
6. Click **"Create Credentials" → API Key**
7. Paste into `.env` as `REACT_APP_GOOGLE_BOOKS_API_KEY`

> Note: The app works without this key too — Open Library handles most book data.

---

### 4. 🤖 Anthropic Claude API — AI Recommendations
**Cost:** Free $5 credit on signup (enough for thousands of recommendations)  
**Limits:** Pay-as-you-go after credit runs out (very cheap — ~$0.003 per recommendation)

**Steps:**
1. Go to → [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up with your email
3. Go to **API Keys → Create Key**
4. Paste into `.env` as `REACT_APP_CLAUDE_API_KEY`

> **Note:** Without a Claude API key, the app still works! It falls back to pre-curated mock recommendations.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 | Component-based, ecosystem |
| **Routing** | React Router v6 | Client-side navigation |
| **State** | Zustand + persist | Lightweight, persistent |
| **Data Fetching** | React Query | Caching, loading states |
| **Styling** | Pure CSS + CSS Variables | No build bloat, full control |
| **Animations** | CSS Keyframes | Performance, no deps |
| **UI Icons** | React Icons | Comprehensive icon library |
| **Notifications** | React Hot Toast | Clean toast system |
| **AI** | Anthropic Claude API | Best recommendation quality |
| **Movies API** | TMDB | Most comprehensive, free |
| **Books API** | Open Library + Google Books | Free, open, no auth needed |

---

## 📁 Project Structure

```
flickbook/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js          # Top navigation
│   │   ├── Navbar.css
│   │   └── MediaCard.js       # Reusable movie/book card
│   ├── pages/
│   │   ├── Home.js            # Hero + trending content
│   │   ├── Movies.js          # Movies & TV browsing
│   │   ├── Books.js           # Books browsing
│   │   ├── Discover.js        # Universal search
│   │   ├── AIRecommend.js     # AI recommendation engine ⭐
│   │   ├── MovieDetail.js     # Movie/TV detail + trailer
│   │   ├── BookDetail.js      # Book detail page
│   │   └── MyList.js          # Watchlist + reading list
│   ├── services/
│   │   ├── tmdb.js            # TMDB API service
│   │   ├── books.js           # Open Library + Google Books
│   │   └── claude.js          # Claude AI service
│   ├── store/
│   │   └── useStore.js        # Zustand global state
│   ├── styles/
│   │   └── global.css         # Global styles & design system
│   ├── App.js                 # Root + routing
│   └── index.js               # Entry point
├── .env.example               # Environment template
├── .gitignore
└── package.json
```

---

## 🎨 Design System

SeeWise uses a cinematic dark aesthetic with:
- **Colors:** Deep space black (`#0a0a0f`) + purple accent (`#c084fc`) + gold (`#f5c842`) + teal (`#2dd4bf`)
- **Fonts:** Playfair Display (display) + Outfit (body) + Space Mono (code/labels)
- **Effects:** Film grain overlay, radial glows, glassmorphism cards
- **Animations:** Fade-in reveals, hover lifts, shimmer loading

---

## 🚢 Deployment

### Vercel (Recommended — Free)
```bash
npm install -g vercel
vercel
# Follow prompts, add env vars in dashboard
```

### Netlify
```bash
npm run build
# Drag /build folder to netlify.app
# Add env vars in Site Settings → Environment
```

### GitHub Pages
```bash
npm install gh-pages --save-dev
# Add to package.json: "homepage": "https://username.github.io/flickbook"
# Add scripts: "predeploy": "npm run build", "deploy": "gh-pages -d build"
npm run deploy
```

---

## 🔮 Future Features

- [ ] User authentication (Supabase)
- [ ] Social sharing of recommendations
- [ ] Reading progress tracker for books
- [ ] Streaming service availability (JustWatch API)
- [ ] Book clubs / watch parties
- [ ] Import from Goodreads / Letterboxd
- [ ] PWA / offline support

---

## 📄 License

MIT — feel free to use, modify, and deploy.

---

## 🙏 Credits

- Movie data: [The Movie Database (TMDB)](https://themoviedb.org)
- Book data: [Open Library](https://openlibrary.org) & [Google Books](https://books.google.com)
- AI: [Anthropic Claude](https://anthropic.com)
- Inspired by: [WatchNow AI](https://watchnowai.com)

---

Made with ❤️ and 🤖
