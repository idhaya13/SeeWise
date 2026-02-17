// src/pages/AIRecommend.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiZap, FiX, FiPlus, FiFilm, FiBook, FiRefreshCw } from 'react-icons/fi';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import claudeService from '../services/claude';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import './AIRecommend.css';

const MOODS = [
  { emoji: '😊', label: 'Feel Good', value: 'feel-good and uplifting' },
  { emoji: '😱', label: 'Thrilling', value: 'thrilling and suspenseful' },
  { emoji: '🥺', label: 'Emotional', value: 'emotional and moving' },
  { emoji: '🤣', label: 'Comedy', value: 'funny and lighthearted' },
  { emoji: '🌌', label: 'Epic', value: 'epic and grand in scale' },
  { emoji: '🧠', label: 'Mind-Bending', value: 'thought-provoking and complex' },
  { emoji: '💕', label: 'Romance', value: 'romantic and heartwarming' },
  { emoji: '👻', label: 'Scary', value: 'scary and atmospheric' },
  { emoji: '🌍', label: 'World Cinema', value: 'diverse and international' },
  { emoji: '🎭', label: 'Dramatic', value: 'dramatic and character-driven' },
];

const CONTENT_TYPES = [
  { key: 'all', label: '🎬📚 Everything', desc: 'Movies, TV & Books' },
  { key: 'movies', label: '🎬 Movies & TV', desc: 'Films and shows only' },
  { key: 'books', label: '📚 Books', desc: 'Books and novels only' },
];

const TYPE_COLORS = {
  movie: 'var(--accent)',
  tv: 'var(--teal)',
  book: 'var(--gold)',
};

const TYPE_ICONS = { movie: '🎬', tv: '📺', book: '📚' };

export default function AIRecommend() {
  const [searchParams] = useSearchParams();
  const moodParam = searchParams.get('mood');

  const [selectedMood, setSelectedMood] = useState('');
  const [contentType, setContentType] = useState('all');
  const [customInput, setCustomInput] = useState('');
  const [likedInputs, setLikedInputs] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { likedTitles, addToWatchlist, addToReadlist, isInWatchlist, isInReadlist } = useStore();

  // Pre-fill from URL mood param
  useEffect(() => {
    if (moodParam) {
      const matched = MOODS.find((m) => moodParam.includes(m.label));
      if (matched) setSelectedMood(matched.value);
    }
    // Seed liked inputs from store
    if (likedTitles.length) setLikedInputs(likedTitles.slice(0, 5));
  }, []);

  const addInput = () => {
    if (currentInput.trim() && !likedInputs.includes(currentInput.trim())) {
      setLikedInputs((prev) => [...prev, currentInput.trim()]);
      setCurrentInput('');
    }
  };

  const removeInput = (title) => {
    setLikedInputs((prev) => prev.filter((t) => t !== title));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addInput(); }
  };

  const handleGetRecommendations = async () => {
    if (!likedInputs.length && !selectedMood && !customInput.trim()) {
      toast.error('Please add at least one title or select a mood!');
      return;
    }
    setLoading(true);
    setHasSearched(true);
    setRecommendations([]);

    try {
      const results = await claudeService.getRecommendations({
        liked: likedInputs,
        mood: selectedMood || customInput,
        type: contentType,
      });
      setRecommendations(results);
      if (results.length === 0) {
        toast.error('No recommendations found. Try different inputs!');
      }
    } catch (err) {
      toast.error('Failed to get recommendations. Check your API key!');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRec = (rec) => {
    const isBook = rec.type === 'book';
    const item = {
      id: `ai-${rec.title.replace(/\s/g, '-').toLowerCase()}`,
      title: rec.title,
      overview: rec.reason,
      year: rec.year,
      mediaType: rec.type,
    };

    if (isBook) {
      addToReadlist(item);
      toast.success('Added to Reading List 📚');
    } else {
      addToWatchlist({ ...item }, rec.type);
      toast.success('Added to Watchlist 🎬');
    }
  };

  const isSaved = (rec) => {
    const id = `ai-${rec.title.replace(/\s/g, '-').toLowerCase()}`;
    if (rec.type === 'book') return isInReadlist(id);
    return isInWatchlist(id, rec.type);
  };

  return (
    <div className="ai-page">
      <div className="container">
        {/* Header */}
        <div className="ai-header fade-in">
          <div className="ai-header-glow" />
          <div className="ai-header-content">
            <div className="ai-icon-badge">
              <FiZap size={28} />
            </div>
            <div>
              <div className="label">Powered by Claude AI</div>
              <h1 className="display-title ai-title">
                Your Personal<br />
                <span className="ai-title-accent">Curator</span>
              </h1>
              <p className="ai-subtitle">
                Tell us what you love and we'll find your next obsession — movies, TV shows, or books.
              </p>
            </div>
          </div>
        </div>

        <div className="ai-layout">
          {/* ===== LEFT: INPUT PANEL ===== */}
          <div className="ai-input-panel fade-in fade-in-1">

            {/* Step 1: Content Type */}
            <div className="ai-section">
              <h3 className="ai-section-title">
                <span className="step-num">1</span> What would you like?
              </h3>
              <div className="type-selector">
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t.key}
                    className={`type-option ${contentType === t.key ? 'active' : ''}`}
                    onClick={() => setContentType(t.key)}
                  >
                    <span className="type-label">{t.label}</span>
                    <span className="type-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Titles You Like */}
            <div className="ai-section">
              <h3 className="ai-section-title">
                <span className="step-num">2</span> Titles you love
              </h3>
              <div className="liked-input-area">
                <div className="liked-input-row">
                  <input
                    type="text"
                    placeholder="e.g. Inception, Dune, Project Hail Mary..."
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                  />
                  <button className="btn btn-primary" onClick={addInput} style={{ flexShrink: 0 }}>
                    <FiPlus /> Add
                  </button>
                </div>
                {likedInputs.length > 0 && (
                  <div className="liked-tags">
                    {likedInputs.map((t) => (
                      <span key={t} className="liked-tag">
                        {t}
                        <button onClick={() => removeInput(t)}><FiX size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Mood */}
            <div className="ai-section">
              <h3 className="ai-section-title">
                <span className="step-num">3</span> Pick a mood
              </h3>
              <div className="mood-grid">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    className={`mood-option ${selectedMood === m.value ? 'active' : ''}`}
                    onClick={() => setSelectedMood(selectedMood === m.value ? '' : m.value)}
                  >
                    <span className="mood-emoji">{m.emoji}</span>
                    <span className="mood-label">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Custom Prompt */}
            <div className="ai-section">
              <h3 className="ai-section-title">
                <span className="step-num">4</span> Anything specific? <span className="optional">(optional)</span>
              </h3>
              <textarea
                className="custom-prompt"
                placeholder="e.g. 'Something with a strong female lead set in space' or 'Books like Dostoevsky but more modern'..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                rows={3}
              />
            </div>

            {/* CTA */}
            <button
              className={`btn btn-primary btn-lg get-recs-btn ${loading ? 'loading' : ''}`}
              onClick={handleGetRecommendations}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" /> Curating your picks...</>
              ) : (
                <><FiZap /> Get My Recommendations</>
              )}
            </button>

            {recommendations.length > 0 && (
              <button className="btn btn-ghost" onClick={handleGetRecommendations} style={{ marginTop: '0.5rem' }}>
                <FiRefreshCw size={14} /> Regenerate
              </button>
            )}
          </div>

          {/* ===== RIGHT: RESULTS ===== */}
          <div className="ai-results-panel">
            {!hasSearched && !loading && (
              <div className="ai-placeholder">
                <div className="placeholder-art">
                  <span>🎬</span><span>📚</span><span>📺</span>
                </div>
                <h3>Your personalized picks will appear here</h3>
                <p>Fill in your preferences and hit <strong>Get My Recommendations</strong></p>
              </div>
            )}

            {loading && (
              <div className="ai-loading">
                <div className="loading-spinner-large" />
                <p>AI is curating your perfect picks...</p>
                <p className="loading-sub">Analyzing preferences · Matching vibes · Finding gems</p>
              </div>
            )}

            {!loading && recommendations.length > 0 && (
              <div className="recs-list fade-in">
                <div className="recs-header">
                  <h2>✨ {recommendations.length} Picks For You</h2>
                  <p className="recs-sub">Based on your preferences, curated by AI</p>
                </div>
                {recommendations.map((rec, i) => (
                  <div key={i} className={`rec-card fade-in`} style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="rec-card-top">
                      <div className="rec-num">{String(i + 1).padStart(2, '0')}</div>
                      <div className="rec-type-badge" style={{ color: TYPE_COLORS[rec.type], borderColor: TYPE_COLORS[rec.type] }}>
                        {TYPE_ICONS[rec.type]} {rec.type?.toUpperCase()}
                      </div>
                    </div>

                    <div className="rec-body">
                      <h3 className="rec-title">{rec.title}</h3>
                      {rec.author_or_director && (
                        <p className="rec-credit">
                          {rec.type === 'book' ? '✍️' : '🎬'} {rec.author_or_director}
                          {rec.year && <span className="rec-year"> · {rec.year}</span>}
                        </p>
                      )}
                      <p className="rec-reason">"{rec.reason}"</p>
                      <div className="rec-tags">
                        {rec.genre && <span className="tag">{rec.genre}</span>}
                        {rec.mood && <span className="tag">{rec.mood}</span>}
                      </div>
                    </div>

                    <div className="rec-actions">
                      <button
                        className={`btn btn-secondary btn-sm ${isSaved(rec) ? 'saved' : ''}`}
                        onClick={() => handleSaveRec(rec)}
                      >
                        {isSaved(rec) ? <BsBookmarkFill /> : <BsBookmark />}
                        {isSaved(rec) ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
