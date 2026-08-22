import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { api } from "../services/api";

const DataCacheContext = createContext(null);

export function DataCacheProvider({ children }) {
  // ---- Feed (HomePage) ----
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const feedLoaded = useRef(false);
  const feedFilterKey = useRef("");

  const [feedFilters, setFeedFilters] = useState({
    region: "all",
    gender: "all",
    ageMin: "",
    ageMax: "",
    search: "",
  });

  const loadFeedPosts = useCallback(
    async (forceRefresh = false) => {
      const currentKey = JSON.stringify(feedFilters);
      if (
        !forceRefresh &&
        feedLoaded.current &&
        feedFilterKey.current === currentKey
      ) {
        return;
      }
      setFeedLoading(true);
      try {
        const res = await api.getPosts(feedFilters);
        if (res?.posts) {
          setFeedPosts(res.posts);
          feedLoaded.current = true;
          feedFilterKey.current = currentKey;
        }
      } catch (err) {
        console.warn("Failed to load feed posts:", err);
      } finally {
        setFeedLoading(false);
      }
    },
    [feedFilters],
  );

  const updateFeedFilters = useCallback((newFilters) => {
    setFeedFilters((prev) => ({ ...prev, ...newFilters }));
    feedLoaded.current = false;
  }, []);

  const resetFeedFilters = useCallback(() => {
    setFeedFilters({
      region: "all",
      gender: "all",
      ageMin: "",
      ageMax: "",
      search: "",
    });
    feedLoaded.current = false;
  }, []);

  // ---- Dating (DatingPage) ----
  const [candidates, setCandidates] = useState([]);
  const [datingLoading, setDatingLoading] = useState(false);
  const datingLoaded = useRef(false);
  const datingFilterKey = useRef("");

  const [datingFilters, setDatingFilters] = useState(null); // null = not initialized yet

  const loadCandidates = useCallback(
    async (forceRefresh = false) => {
      if (!datingFilters) return;
      const currentKey = JSON.stringify(datingFilters);
      if (
        !forceRefresh &&
        datingLoaded.current &&
        datingFilterKey.current === currentKey
      ) {
        return;
      }
      setDatingLoading(true);
      try {
        const res = await api.getDatingCards(datingFilters);
        if (res?.candidates) {
          setCandidates(res.candidates);
          datingLoaded.current = true;
          datingFilterKey.current = currentKey;
        }
      } catch (err) {
        console.warn("Failed to load candidates:", err);
      } finally {
        setDatingLoading(false);
      }
    },
    [datingFilters],
  );

  const initDatingFilters = useCallback((defaultFilters) => {
    setDatingFilters((prev) => {
      // Agar oldin o'rnatilgan bo'lsa, saqlab qo'yamiz
      if (prev !== null) return prev;
      return defaultFilters;
    });
  }, []);

  const updateDatingFilters = useCallback((newFilters) => {
    setDatingFilters((prev) => ({ ...prev, ...newFilters }));
    datingLoaded.current = false;
  }, []);

  const removeCandidateLocally = useCallback((userId) => {
    setCandidates((prev) => prev.filter((c) => c.user_id !== userId));
  }, []);

  // ---- Matches (MatchesPage) ----
  const [matches, setMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const matchesLoaded = useRef(false);

  const loadMatches = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && matchesLoaded.current) {
        return;
      }
      setMatchesLoading(true);
      try {
        const res = await api.getMatches();
        if (res?.matches) {
          setMatches(res.matches);
          matchesLoaded.current = true;
        }
      } catch (err) {
        console.warn("Matches load error:", err);
      } finally {
        setMatchesLoading(false);
      }
    },
    [],
  );

  const removeMatchLocally = useCallback((matchId) => {
    setMatches((prev) => prev.filter((m) => m.match_id !== matchId));
  }, []);

  // ---- Profile Posts ----
  const [userPosts, setUserPosts] = useState([]);
  const [userPostsLoading, setUserPostsLoading] = useState(false);
  const userPostsLoaded = useRef(false);
  const userPostsUserId = useRef(null);

  const loadUserPosts = useCallback(
    async (userId, forceRefresh = false) => {
      if (
        !forceRefresh &&
        userPostsLoaded.current &&
        userPostsUserId.current === userId
      ) {
        return;
      }
      setUserPostsLoading(true);
      try {
        const res = await api.getPosts({ userId });
        if (res?.posts) {
          setUserPosts(res.posts);
          userPostsLoaded.current = true;
          userPostsUserId.current = userId;
        }
      } catch (err) {
        console.warn("Error loading user posts:", err);
      } finally {
        setUserPostsLoading(false);
      }
    },
    [],
  );

  // ---- Feed post helpers ----
  const handleFeedLikeToggled = useCallback((postId, hasLiked, newCount) => {
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, hasLiked, likes_count: newCount } : p,
      ),
    );
  }, []);

  const handleFeedCommentAdded = useCallback((postId, comment) => {
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments_count: (p.comments_count || 0) + 1,
              comments: [...(p.comments || []), comment],
            }
          : p,
      ),
    );
  }, []);

  return (
    <DataCacheContext.Provider
      value={{
        // Feed
        feedPosts,
        feedLoading,
        feedFilters,
        loadFeedPosts,
        updateFeedFilters,
        resetFeedFilters,
        handleFeedLikeToggled,
        handleFeedCommentAdded,

        // Dating
        candidates,
        datingLoading,
        datingFilters,
        loadCandidates,
        initDatingFilters,
        updateDatingFilters,
        removeCandidateLocally,

        // Matches
        matches,
        matchesLoading,
        loadMatches,
        removeMatchLocally,

        // Profile posts
        userPosts,
        userPostsLoading,
        loadUserPosts,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error("useDataCache must be used within a DataCacheProvider");
  }
  return context;
}
