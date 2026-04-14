// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import SaveModal from './components/SaveModal';
import Home from './pages/Home';
import Movies from './pages/Movies';
import Books from './pages/Books';
import Discover from './pages/Discover';
import MyList from './pages/MyList';
import MovieDetail from './pages/MovieDetail';
import BookDetail from './pages/BookDetail';
import AIRecommend from './pages/AIRecommend';
import NowPlaying from './pages/NowPlaying';
import Kids from './pages/Kids';
import QuickWatch from './pages/QuickWatch';
import Login from './pages/Login';

import useStore from './store/useStore';
import { supabase } from './services/supabase';

import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const syncUserFromSupabase = useStore((state) => state.syncUserFromSupabase);

  useEffect(() => {
    // Initial sync
    syncUserFromSupabase();

    // Listen for auth changes (login/logout events from Supabase directly)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      syncUserFromSupabase();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [syncUserFromSupabase]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <SaveModal />
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv" element={<Movies />} />
              <Route path="/books" element={<Books />} />
              <Route path="/now-playing" element={<NowPlaying />} />
              <Route path="/kids" element={<Kids />} />
              <Route path="/quick-watch" element={<QuickWatch />} />
              <Route path="/login" element={<Login />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/my-list" element={<MyList />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/book/:id" element={<BookDetail />} />
              <Route path="/ai-recommend" element={<AIRecommend />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#e2e2ff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontFamily: "'Outfit', sans-serif",
            },
            success: { iconTheme: { primary: '#c084fc', secondary: '#1a1a2e' } },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
