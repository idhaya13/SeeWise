// src/store/useStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // --- Watchlist / Reading list (legacy) ---
      watchlist: [],
      readlist: [],

      // --- Offline Custom Playlists ---
      guestPlaylists: [{ id: 'playlist-guest-default', name: 'My Watchlist', items: [] }],
      
      // --- Save Modal UI State ---
      saveModalState: { isOpen: false, item: null },
      openSaveModal: (item) => set({ saveModalState: { isOpen: true, item } }),
      closeSaveModal: () => set({ saveModalState: { isOpen: false, item: null } }),

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

      // --- Global Language ---
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),

      // --- Regional content language for movie/tv selection ---
      contentLanguage: 'en',
      setContentLanguage: (lang) => set({ contentLanguage: lang }),
      
      // --- Regional filter for language-specific content ---
      regionalOnly: false,
      setRegionalOnly: (enabled) => set({ regionalOnly: enabled }),

      // --- Auth & User List ---
      users: [],
      currentUser: null,
      isGuest: false,
      
      setGuestMode: (isGuest) => set({ isGuest }),
      
      enterGuestMode: () => {
        set({ currentUser: null, isGuest: true });
      },
      loginUser: (username, password) => {
        const found = get().users.find((u) => u.username === username && u.password === password);
        if (!found) return false;
        const normalized = {
          ...found,
          playlists: found.playlists || [{ id: 'playlist-default', name: 'Default List', items: [] }],
          activePlaylistId: found.activePlaylistId || (found.playlists?.[0]?.id || 'playlist-default'),
          ratings: found.ratings || {},
          savedList: found.savedList || [],
        };
        set({
          currentUser: normalized,
          users: get().users.map((u) => (u.id === normalized.id ? normalized : u)),
        });
        return true;
      },
      registerUser: (username, password) => {
        if (get().users.some((u) => u.username === username)) return false;
        const defaultPlaylist = {
          id: 'playlist-default',
          name: 'Default List',
          items: [],
        };
        const newUser = {
          id: Date.now().toString(),
          username,
          password,
          savedList: [],
          playlists: [defaultPlaylist],
          activePlaylistId: defaultPlaylist.id,
          ratings: {},
        };
        set({ users: [...get().users, newUser], currentUser: newUser });
        return true;
      },
      logoutUser: () => set({ currentUser: null, isGuest: false }),
      setActivePlaylist: (playlistId) => {
        const user = get().currentUser;
        if (!user) return;
        const playlists = Array.isArray(user.playlists) ? user.playlists : [];
        const exists = playlists.some((pl) => pl.id === playlistId);
        if (!exists) return;
        const updatedUser = { ...user, activePlaylistId: playlistId, playlists };
        set({ currentUser: updatedUser, users: get().users.map((u) => (u.id === user.id ? updatedUser : u)) });
      },
      createPlaylist: (name) => {
        const user = get().currentUser;
        if (!name.trim()) return;
        const playlistId = `playlist-${Date.now()}`;
        const newPlaylist = { id: playlistId, name: name.trim(), items: [] };
        
        if (user) {
          const playlists = Array.isArray(user.playlists) ? user.playlists : [];
          const updatedUser = {
            ...user,
            playlists: [...playlists, newPlaylist],
            activePlaylistId: playlistId,
          };
          set({ currentUser: updatedUser, users: get().users.map((u) => (u.id === user.id ? updatedUser : u)) });
        } else {
          set({ guestPlaylists: [...get().guestPlaylists, newPlaylist] });
        }
      },
      deletePlaylist: (playlistId) => {
        const user = get().currentUser;
        if (!user || playlistId === 'playlist-default') return;
        const playlists = Array.isArray(user.playlists) ? user.playlists : [];
        const updatedPlaylists = playlists.filter((pl) => pl.id !== playlistId);
        const activePlaylistId = user.activePlaylistId === playlistId ? (updatedPlaylists[0]?.id || 'playlist-default') : user.activePlaylistId;
        const updatedUser = { ...user, playlists: updatedPlaylists, activePlaylistId };
        set({ currentUser: updatedUser, users: get().users.map((u) => (u.id === user.id ? updatedUser : u)) });
      },
      addToPlaylist: (itemId, item, playlistId) => {
        const user = get().currentUser;
        if (!playlistId) return;
        
        if (user) {
          const playlists = user.playlists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            if (pl.items.some((i) => (i.id || i.imdbID || i.olKey) === itemId)) return pl;
            return { ...pl, items: [...pl.items, item] };
          });
          const updatedUser = { ...user, playlists };
          set({ currentUser: updatedUser, users: get().users.map((u) => (u.id === user.id ? updatedUser : u)) });
        } else {
          const playlists = get().guestPlaylists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            if (pl.items.some((i) => (i.id || i.imdbID || i.olKey) === itemId)) return pl;
            return { ...pl, items: [...pl.items, item] };
          });
          set({ guestPlaylists: playlists });
        }
      },
      removeFromPlaylist: (itemId, playlistId) => {
        const user = get().currentUser;
        if (!playlistId) return;
        
        if (user) {
          const playlists = user.playlists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            return { ...pl, items: pl.items.filter((i) => (i.id || i.imdbID || i.olKey) !== itemId) };
          });
          const updatedUser = { ...user, playlists };
          set({ currentUser: updatedUser, users: get().users.map((u) => (u.id === user.id ? updatedUser : u)) });
        } else {
          const playlists = get().guestPlaylists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            return { ...pl, items: pl.items.filter((i) => (i.id || i.imdbID || i.olKey) !== itemId) };
          });
          set({ guestPlaylists: playlists });
        }
      },
      addToUserSavedList: (item) => {
        const user = get().currentUser;
        if (!user) return;
        const normalizedUser = {
          ...user,
          playlists: user.playlists || [{ id: 'playlist-default', name: 'Default List', items: [] }],
          activePlaylistId: user.activePlaylistId || (user.playlists?.[0]?.id || 'playlist-default'),
          ratings: user.ratings || {},
          savedList: user.savedList || [],
        };
        const idKey = item.id || item.imdbID;
        let updatedUser = normalizedUser;

        if (!normalizedUser.savedList.some((i) => (i.id || i.imdbID) === idKey)) {
          updatedUser = { ...normalizedUser, savedList: [...normalizedUser.savedList, item] };
          set({ currentUser: updatedUser, users: get().users.map((u) => (u.id === normalizedUser.id ? updatedUser : u)) });
        }

        return get().addToPlaylist(idKey, item, updatedUser.activePlaylistId);
      },
      removeFromUserSavedList: (itemId) => {
        const user = get().currentUser;
        if (!user) return;
        const updatedUser = {
          ...user,
          savedList: user.savedList.filter((i) => (i.id || i.imdbID) !== itemId),
          playlists: user.playlists.map((pl) => ({
            ...pl,
            items: pl.items.filter((it) => (it.id || it.imdbID) !== itemId),
          })),
        };
        set({ currentUser: updatedUser, users: get().users.map((u) => (u.id === user.id ? updatedUser : u)) });
      },
      // --- Ratings ---
      ratings: {}, // global fallback for unauthenticated users
      setRating: (itemId, rating) => {
        const user = get().currentUser;
        if (user) {
          const updatedUser = {
            ...user,
            ratings: {
              ...user.ratings,
              [itemId]: rating,
            },
          };
          set({
            currentUser: updatedUser,
            users: get().users.map((u) => (u.id === user.id ? updatedUser : u)),
          });
        } else {
          set({ ratings: { ...get().ratings, [itemId]: rating } });
        }
      },
      getRating: (itemId) => {
        const user = get().currentUser;
        if (user && user.ratings) return user.ratings[itemId] || 0;
        return get().ratings[itemId] || 0;
      },

      // --- Comments ---
      comments: {}, // global fallback for unauthenticated users
      addComment: (itemId, comment) => {
        const user = get().currentUser;
        const commentData = {
          id: Date.now().toString(),
          text: comment,
          timestamp: Date.now(),
          userId: user ? user.id : 'guest',
          username: user ? user.username : 'Guest',
        };
        if (user) {
          const userComments = user.comments || {};
          const updatedUser = {
            ...user,
            comments: {
              ...userComments,
              [itemId]: [...(userComments[itemId] || []), commentData],
            },
          };
          set({
            currentUser: updatedUser,
            users: get().users.map((u) => (u.id === user.id ? updatedUser : u)),
          });
        } else {
          const globalComments = get().comments;
          set({
            comments: {
              ...globalComments,
              [itemId]: [...(globalComments[itemId] || []), commentData],
            },
          });
        }
      },
      getComments: (itemId) => {
        const user = get().currentUser;
        if (user && user.comments) {
          return user.comments[itemId] || [];
        }
        return get().comments[itemId] || [];
      },
      deleteComment: (itemId, commentId) => {
        const user = get().currentUser;
        if (user) {
          const userComments = user.comments || {};
          const updatedUser = {
            ...user,
            comments: {
              ...userComments,
              [itemId]: (userComments[itemId] || []).filter(c => c.id !== commentId),
            },
          };
          set({
            currentUser: updatedUser,
            users: get().users.map((u) => (u.id === user.id ? updatedUser : u)),
          });
        } else {
          const globalComments = get().comments;
          set({
            comments: {
              ...globalComments,
              [itemId]: (globalComments[itemId] || []).filter(c => c.id !== commentId),
            },
          });
        }
      },
    }),
    {
      name: 'seewise-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        readlist: state.readlist,
        guestPlaylists: state.guestPlaylists,
        likedTitles: state.likedTitles,
        theme: state.theme,
        language: state.language,
        contentLanguage: state.contentLanguage,
        users: state.users,
        currentUser: state.currentUser,
        ratings: state.ratings,
        comments: state.comments,
      }),
    }
  )
);

export default useStore;
