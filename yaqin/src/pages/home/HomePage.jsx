import React, { useState, useEffect, useCallback } from "react";
import FilterBar from "../../components/feed/FilterBar";
import PostCard from "../../components/feed/PostCard";
import CommentsModal from "../../components/feed/CommentsModal";
import { api } from "../../services/api";
import { FaPlus, FaSpinner, FaRegSmile } from "react-icons/fa";

function HomePage({ onOpenCreatePost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);

  const [filters, setFilters] = useState({
    region: "all",
    gender: "all",
    ageMin: "",
    ageMax: "",
    search: "",
  });

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getPosts(filters);
      if (res?.posts) {
        setPosts(res.posts);
      }
    } catch (err) {
      console.warn("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      region: "all",
      gender: "all",
      ageMin: "",
      ageMax: "",
      search: "",
    });
  };

  const handleLikeToggled = (postId, hasLiked, newCount) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, hasLiked, likes_count: newCount } : p
      )
    );
  };

  const handleCommentAdded = (postId, comment) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments_count: (p.comments_count || 0) + 1,
              comments: [...(p.comments || []), comment],
            }
          : p
      )
    );
  };

  return (
    <div className="home-page-container">
      {/* Dynamic Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Feed Stream */}
      <div className="feed-posts-stream">
        {loading ? (
          <div className="feed-loading-state">
            <FaSpinner className="spinner-anim" />
            <p>Postlar va mos tavsiyalar saralanmoqda...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty-state fade-in-content">
            <div className="empty-state-icon">
              <FaRegSmile />
            </div>
            <h3>Ushbu filtrlar bo'yicha postlar topilmadi</h3>
            <p>Filtrlarni tozalab ko'ring yoki birinchi bo'lib qiziqarli post qoldiring!</p>
            <div className="empty-actions">
              <button className="reset-btn" onClick={handleResetFilters}>
                Filtrlarni tozalash
              </button>
              <button className="primary-create-btn" onClick={onOpenCreatePost}>
                <FaPlus /> Yangi post qo'shish
              </button>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenComments={(p) => setActiveCommentsPost(p)}
              onLikeToggled={handleLikeToggled}
            />
          ))
        )}
      </div>

      {/* Comments Drawer / Modal */}
      {activeCommentsPost && (
        <CommentsModal
          isOpen={Boolean(activeCommentsPost)}
          post={activeCommentsPost}
          onClose={() => setActiveCommentsPost(null)}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}

export default HomePage;
