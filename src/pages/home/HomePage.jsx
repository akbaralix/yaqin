import React, { useState, useEffect, useCallback } from "react";
import FilterBar from "../../components/feed/FilterBar";
import PostCard from "../../components/feed/PostCard";
import CommentsModal from "../../components/feed/CommentsModal";
import { FaPlus, FaSpinner, FaRegSmile } from "react-icons/fa";
import { useDataCache } from "../../context/DataCacheContext";

function HomePage({ onOpenCreatePost }) {
  const {
    feedPosts,
    feedLoading,
    feedFilters,
    loadFeedPosts,
    updateFeedFilters,
    resetFeedFilters,
    handleFeedLikeToggled,
    handleFeedCommentAdded,
  } = useDataCache();

  const [activeCommentsPost, setActiveCommentsPost] = useState(null);

  // Sahifa ochilganda kesh bo'lsa yuklamaydi, yo'q bo'lsa yuklaydi
  useEffect(() => {
    loadFeedPosts();
  }, [loadFeedPosts]);

  return (
    <div className="home-page-container">
      {/* Dynamic Filter Bar */}
      <FilterBar
        filters={feedFilters}
        onFilterChange={updateFeedFilters}
        onReset={resetFeedFilters}
      />

      {/* Feed Stream */}
      <div className="feed-posts-stream">
        {feedLoading ? (
          <div className="feed-loading-state">
            <FaSpinner className="spinner-anim" />
            <p>Postlar va mos tavsiyalar saralanmoqda...</p>
          </div>
        ) : feedPosts.length === 0 ? (
          <div className="feed-empty-state fade-in-content">
            <div className="empty-state-icon">
              <FaRegSmile />
            </div>
            <h3>Ushbu filtrlar bo'yicha postlar topilmadi</h3>
            <p>Filtrlarni tozalab ko'ring yoki birinchi bo'lib qiziqarli post qoldiring!</p>
            <div className="empty-actions">
              <button className="reset-btn" onClick={resetFeedFilters}>
                Filtrlarni tozalash
              </button>
              <button className="primary-create-btn" onClick={onOpenCreatePost}>
                <FaPlus /> Yangi post qo'shish
              </button>
            </div>
          </div>
        ) : (
          feedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenComments={(p) => setActiveCommentsPost(p)}
              onLikeToggled={handleFeedLikeToggled}
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
          onCommentAdded={handleFeedCommentAdded}
        />
      )}
    </div>
  );
}

export default HomePage;
