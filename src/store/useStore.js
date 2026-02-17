// src/store/useStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // --- Watchlist / Reading list ---
      watchlist: [],
      readlist: [],

      addToWatchlist: (item) => {
        const current = get().watchlist;
        if (!current.find((i) => i.id === item.id && i.type === item.type)) {
          set({ watchlist: [...current, { ...item, addedAt: Date.now() }] });
        }
      },

      removeFromWatchlist: (id, type) => {
        set({ watchlist: get().watchlist.filter((i) => !(i.id === id && i.type === type)) });
      },

      addToReadlist: (book) => {
        const current = get().readlist;
        if (!current.find((i) => i.id === book.id)) {
          set({ readlist: [...current, { ...book, addedAt: Date.now() }] });
        }
      },

      removeFromReadlist: (id) => {
        set({ readlist: get().readlist.filter((i) => i.id !== id) });
      },

      isInWatchlist: (id, type) =>
        get().watchlist.some((i) => i.id === id && i.type === type),

      isInReadlist: (id) =>
        get().readlist.some((i) => i.id === id),

      // --- Search history for AI recommendations ---
      likedTitles: [],

      addLikedTitle: (title) => {
        const current = get().likedTitles;
        if (!current.includes(title)) {
          set({ likedTitles: [...current.slice(-9), title] }); // keep last 10
        }
      },

      removeLikedTitle: (title) => {
        set({ likedTitles: get().likedTitles.filter((t) => t !== title) });
      },

      clearLikedTitles: () => set({ likedTitles: [] }),

      // --- Active tab ---
      activeTab: 'home',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // --- Theme ---
      theme: 'dark',
      toggleTheme: () =>
        set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'seewise-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        readlist: state.readlist,
        likedTitles: state.likedTitles,
        theme: state.theme,
      }),
    }
  )
);

export default useStore;
