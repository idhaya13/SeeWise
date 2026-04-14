import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// Helper: fetch all user data from Supabase
// Returns { playlists, ratings, comments } or throws
// ─────────────────────────────────────────────
async function fetchUserData(userId) {
  const [{ data: playlistsData, error: plErr }, { data: itemsData, error: itErr }] =
    await Promise.all([
      supabase.from('playlists').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      supabase.from('playlist_items').select('*').eq('user_id', userId),
    ]);

  if (plErr) throw plErr;
  if (itErr) throw itErr;

  // Build playlist array with items
  let playlists = [];
  if (playlistsData && playlistsData.length > 0) {
    playlists = playlistsData.map((p) => ({
      id: p.id,
      name: p.name,
      items: itemsData ? itemsData.filter((i) => i.playlist_id === p.id).map((i) => i.item_data) : [],
    }));
  } else {
    // Create default playlist for first-time users
    const { data: newList, error: newErr } = await supabase
      .from('playlists')
      .insert({ user_id: userId, name: 'My Watchlist' })
      .select()
      .single();
    if (newErr) throw newErr;
    playlists = [{ id: newList.id, name: newList.name, items: [] }];
  }

  // Ratings
  const { data: ratingsData } = await supabase.from('ratings').select('*').eq('user_id', userId);
  const ratings = {};
  if (ratingsData) ratingsData.forEach((r) => { ratings[r.item_id] = r.rating; });

  // Comments
  const { data: commentsData } = await supabase.from('comments').select('*').eq('user_id', userId);
  const comments = {};
  if (commentsData) {
    commentsData.forEach((c) => {
      if (!comments[c.item_id]) comments[c.item_id] = [];
      comments[c.item_id].push(c);
    });
  }

  return { playlists, ratings, comments };
}

const useStore = create(
  persist(
    (set, get) => ({
      // ── UI only (persisted) ──────────────────
      theme: 'dark',
      language: 'en',
      contentLanguage: 'en',
      regionalOnly: false,
      likedTitles: [],
      activeTab: 'home',

      // ── Guest offline playlists ──────────────
      guestPlaylists: [{ id: 'playlist-guest-default', name: 'My Watchlist', items: [] }],

      // ── Auth state ───────────────────────────
      currentUser: null,
      isGuest: false,
      isSyncing: false,

      // ── Save Modal ───────────────────────────
      saveModalState: { isOpen: false, item: null },
      openSaveModal: (item) => set({ saveModalState: { isOpen: true, item } }),
      closeSaveModal: () => set({ saveModalState: { isOpen: false, item: null } }),

      // ── Theme ────────────────────────────────
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      // ── Language ─────────────────────────────
      setLanguage: (lang) => set({ language: lang }),
      setContentLanguage: (lang) => set({ contentLanguage: lang }),
      setRegionalOnly: (enabled) => set({ regionalOnly: enabled }),
      setActiveTab: (tab) => set({ activeTab: tab }),

      // ── Liked Titles ─────────────────────────
      addLikedTitle: (title) => {
        const current = get().likedTitles;
        if (!current.includes(title)) {
          set({ likedTitles: [...current.slice(-9), title] });
        }
      },
      removeLikedTitle: (title) =>
        set({ likedTitles: get().likedTitles.filter((t) => t !== title) }),
      clearLikedTitles: () => set({ likedTitles: [] }),

      // ── Guest mode ───────────────────────────
      enterGuestMode: () => set({ currentUser: null, isGuest: true }),
      setGuestMode: (isGuest) => set({ isGuest }),

      // ── AUTH ─────────────────────────────────
      loginUser: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        await get().syncUserFromSupabase();
        return { success: true };
      },

      registerUser: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { success: false, error: error.message };
        if (data.user && !data.session) {
          return { success: false, error: 'Please check your email to confirm your account.' };
        }
        await get().syncUserFromSupabase();
        return { success: true };
      },

      logoutUser: async () => {
        await supabase.auth.signOut();
        set({ currentUser: null, isGuest: false });
      },

      // ── SYNC from Supabase (called on login, register, page load) ─────────
      syncUserFromSupabase: async () => {
        // Prevent double sync
        if (get().isSyncing) return;
        set({ isSyncing: true });

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            set({ currentUser: null, isSyncing: false });
            return;
          }

          const supabaseUser = session.user;
          const { playlists, ratings, comments } = await fetchUserData(supabaseUser.id);

          const normalizedUser = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            username: supabaseUser.email?.split('@')[0] || 'User',
            playlists,
            activePlaylistId: playlists[0]?.id,
            ratings,
            comments,
          };

          set({ currentUser: normalizedUser, isGuest: false, isSyncing: false });
        } catch (err) {
          console.error('Supabase sync failed:', err);
          toast.error(`Sync failed: ${err.message}`);
          set({ isSyncing: false });
        }
      },

      // ── PLAYLISTS ────────────────────────────
      setActivePlaylist: (playlistId) => {
        const user = get().currentUser;
        if (!user) return;
        const exists = (user.playlists || []).some((pl) => pl.id === playlistId);
        if (!exists) return;
        set({ currentUser: { ...user, activePlaylistId: playlistId } });
      },

      createPlaylist: async (name) => {
        const trimmed = name?.trim();
        if (!trimmed) return;
        const user = get().currentUser;

        if (user) {
          const { data, error } = await supabase
            .from('playlists')
            .insert({ user_id: user.id, name: trimmed })
            .select()
            .single();
          if (error) { toast.error(`Could not create playlist: ${error.message}`); return; }

          const newPlaylist = { id: data.id, name: data.name, items: [] };
          set({
            currentUser: {
              ...user,
              playlists: [...(user.playlists || []), newPlaylist],
              activePlaylistId: data.id,
            },
          });
        } else {
          const newPlaylist = { id: `playlist-${Date.now()}`, name: trimmed, items: [] };
          set({ guestPlaylists: [...get().guestPlaylists, newPlaylist] });
        }
      },

      deletePlaylist: async (playlistId) => {
        const user = get().currentUser;
        if (!user) return;

        const playlists = (user.playlists || []).filter((pl) => pl.id !== playlistId);
        const activePlaylistId =
          user.activePlaylistId === playlistId ? playlists[0]?.id : user.activePlaylistId;
        set({ currentUser: { ...user, playlists, activePlaylistId } });

        const { error } = await supabase
          .from('playlists')
          .delete()
          .eq('id', playlistId)
          .eq('user_id', user.id);
        if (error) toast.error(`Could not delete playlist from database: ${error.message}`);
      },

      addToPlaylist: async (itemId, item, playlistId) => {
        if (!playlistId) return;
        const user = get().currentUser;

        if (user) {
          // Optimistic UI update
          const playlists = (user.playlists || []).map((pl) => {
            if (pl.id !== playlistId) return pl;
            if (pl.items.some((i) => String(i.id || i.imdbID || i.olKey) === String(itemId))) return pl;
            return { ...pl, items: [...pl.items, item] };
          });
          set({ currentUser: { ...user, playlists } });

          // Persist to DB
          const { error } = await supabase.from('playlist_items').insert({
            playlist_id: playlistId,
            user_id: user.id,
            item_id: String(itemId),
            item_type: item.media_type || item.mediaType || item.type || 'movie',
            item_data: item,
          });

          if (error) {
            // Rollback optimistic update
            set({ currentUser: user });
            toast.error(`Could not save to list: ${error.message}`);
          }
        } else {
          // Guest mode
          const playlists = get().guestPlaylists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            if (pl.items.some((i) => String(i.id || i.imdbID || i.olKey) === String(itemId))) return pl;
            return { ...pl, items: [...pl.items, item] };
          });
          set({ guestPlaylists: playlists });
        }
      },

      removeFromPlaylist: async (itemId, playlistId) => {
        if (!playlistId) return;
        const user = get().currentUser;

        if (user) {
          // Optimistic UI update
          const playlists = (user.playlists || []).map((pl) => {
            if (pl.id !== playlistId) return pl;
            return {
              ...pl,
              items: pl.items.filter((i) => String(i.id || i.imdbID || i.olKey) !== String(itemId)),
            };
          });
          set({ currentUser: { ...user, playlists } });

          const { error } = await supabase
            .from('playlist_items')
            .delete()
            .eq('playlist_id', playlistId)
            .eq('item_id', String(itemId))
            .eq('user_id', user.id);

          if (error) toast.error(`Could not remove from database: ${error.message}`);
        } else {
          const playlists = get().guestPlaylists.map((pl) => {
            if (pl.id !== playlistId) return pl;
            return {
              ...pl,
              items: pl.items.filter((i) => String(i.id || i.imdbID || i.olKey) !== String(itemId)),
            };
          });
          set({ guestPlaylists: playlists });
        }
      },

      // ── Convenience save (saves to active playlist) ───────────────────────
      addToUserSavedList: (item) => {
        const user = get().currentUser;
        if (!user) return;
        const playlistId = user.activePlaylistId || user.playlists?.[0]?.id;
        if (!playlistId) {
          toast.error('No playlist found. Please create one first.');
          return;
        }
        const itemId = String(item.id || item.imdbID || item.olKey);
        return get().addToPlaylist(itemId, item, playlistId);
      },

      removeFromUserSavedList: (itemId) => {
        const user = get().currentUser;
        if (!user) return;
        const playlistId = user.activePlaylistId || user.playlists?.[0]?.id;
        if (!playlistId) return;
        return get().removeFromPlaylist(String(itemId), playlistId);
      },

      // ── Legacy helpers (still used by MediaCard) ──────────────────────────
      watchlist: [],
      readlist: [],
      addToWatchlist: (item) => {
        const current = get().watchlist;
        if (!current.find((i) => i.id === item.id && i.type === item.type)) {
          set({ watchlist: [...current, { ...item, addedAt: Date.now() }] });
        }
      },
      removeFromWatchlist: (id, type) =>
        set({ watchlist: get().watchlist.filter((i) => !(i.id === id && i.type === type)) }),
      addToReadlist: (book) => {
        const current = get().readlist;
        if (!current.find((i) => i.id === book.id)) {
          set({ readlist: [...current, { ...book, addedAt: Date.now() }] });
        }
      },
      removeFromReadlist: (id) =>
        set({ readlist: get().readlist.filter((i) => i.id !== id) }),
      isInWatchlist: (id, type) =>
        get().watchlist.some((i) => i.id === id && i.type === type),
      isInReadlist: (id) => get().readlist.some((i) => i.id === id),

      // ── Ratings ───────────────────────────────────────────────────────────
      ratings: {},
      setRating: async (itemId, rating) => {
        const user = get().currentUser;
        if (user) {
          // Optimistic update
          set({ currentUser: { ...user, ratings: { ...user.ratings, [itemId]: rating } } });

          const { error } = await supabase.from('ratings').upsert(
            { user_id: user.id, item_id: String(itemId), rating },
            { onConflict: 'user_id,item_id' }
          );
          if (error) toast.error(`Could not save rating: ${error.message}`);
        } else {
          set({ ratings: { ...get().ratings, [itemId]: rating } });
        }
      },
      getRating: (itemId) => {
        const user = get().currentUser;
        if (user?.ratings) return user.ratings[itemId] || 0;
        return get().ratings[itemId] || 0;
      },

      // ── Comments ──────────────────────────────────────────────────────────
      comments: {},
      addComment: async (itemId, comment) => {
        const user = get().currentUser;
        const commentData = {
          id: Date.now().toString(),
          text: comment,
          timestamp: Date.now(),
          userId: user ? user.id : 'guest',
          username: user ? user.username : 'Guest',
        };

        if (user) {
          const userComments = { ...user.comments };
          userComments[itemId] = [...(userComments[itemId] || []), commentData];
          set({ currentUser: { ...user, comments: userComments } });

          const { error } = await supabase.from('comments').insert({
            user_id: user.id,
            username: user.username,
            item_id: String(itemId),
            text: comment,
            timestamp: commentData.timestamp,
          });
          if (error) toast.error(`Could not post comment: ${error.message}`);
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
        if (user?.comments) return user.comments[itemId] || [];
        return get().comments[itemId] || [];
      },
      deleteComment: (itemId, commentId) => {
        const user = get().currentUser;
        if (user) {
          const userComments = { ...user.comments };
          userComments[itemId] = (userComments[itemId] || []).filter((c) => c.id !== commentId);
          set({ currentUser: { ...user, comments: userComments } });
        } else {
          const globalComments = get().comments;
          set({
            comments: {
              ...globalComments,
              [itemId]: (globalComments[itemId] || []).filter((c) => c.id !== commentId),
            },
          });
        }
      },

      // legacy users list
      users: [],
    }),
    {
      name: 'seewise-storage',
      // Only persist UI preferences and guest data — NOT currentUser.
      // currentUser always comes fresh from Supabase on every load.
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        contentLanguage: state.contentLanguage,
        regionalOnly: state.regionalOnly,
        likedTitles: state.likedTitles,
        guestPlaylists: state.guestPlaylists,
        watchlist: state.watchlist,
        readlist: state.readlist,
        ratings: state.ratings,
        comments: state.comments,
      }),
    }
  )
);

export default useStore;
