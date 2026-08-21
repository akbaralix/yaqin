import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { api } from "../services/api";

const FeedContext = createContext(null);

export function FeedProvider({ children }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    region: "all",
    gender: "all",
    ageMin: "",
    ageMax: "",
    search: "",
  });

  // Track if posts have been loaded at least once
  const hasLoaded = useRef(false);
  // Track current filter signature to detect changes
  const lastFilterKey = useRef("");

  const getFilterKey = (f) => JSON.stringify(f);

  const loadPosts = useCallback(
    async (forceRefresh = false) => {
      const currentKey = getFilterKey(filters);

      // Skip if already loaded with same filters and not forcing refresh
      if (
        !forceRefresh &&
        hasLoaded.current &&
        lastFilterKey.current === currentKey
      ) {
        return;
      }

      setLoading(true);
      try {
        const res = await api.getPosts(filters);
        if (res?.posts) {
          setPosts(res.posts);
          hasLoaded.current = true;
          lastFilterKey.current = currentKey;
        }
      } catch (err) {
        console.warn("Failed to load posts:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // Mark as needing reload since filters changed
    hasLoaded.current = false;
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      region: "all",
      gender: "all",
      ageMin: "",
      ageMax: "",
      search: "",
    });
    hasLoaded.current = false;
  }, []);

  const handleLikeToggled = useCallback((postId, hasLiked, newCount) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, hasLiked, likes_count: newCount } : p,
      ),
    );
  }, []);

  const handleCommentAdded = useCallback((postId, comment) => {
    setPosts((prev) =>
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

  const refreshFeed = useCallback(() => {
    loadPosts(true);
  }, [loadPosts]);

  return (
    <FeedContext.Provider
      value={{
        posts,
        loading,
        filters,
        loadPosts,
        updateFilters,
        resetFilters,
        handleLikeToggled,
        handleCommentAdded,
        refreshFeed,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error("useFeed must be used within a FeedProvider");
  }
  return context;
}
