import React, { useState, useEffect, useRef } from "react";
import FilterBar from "../../components/feed/FilterBar";
import PostCard from "../../components/feed/PostCard";
import CommentsModal from "../../components/feed/CommentsModal";
import { FaPlus, FaSpinner, FaRegSmile } from "react-icons/fa";
import { useDataCache } from "../../context/DataCacheContext";

function HomePage({ onOpenCreatePost }) {
  const {
    feedPosts,
    feedLoading,
    feedLoadingMore,
    feedHasMore,
    feedFilters,
    loadFeedPosts,
    loadMoreFeedPosts,
    updateFeedFilters,
    resetFeedFilters,
    handleFeedLikeToggled,
    handleFeedCommentAdded,
  } = useDataCache();

  const [activeCommentsPost, setActiveCommentsPost] = useState(null);
  const bottomObserverRef = useRef(null);

  // Sahifa ochilganda kesh bo'lsa yuklamaydi, yo'q bo'lsa yuklaydi
  useEffect(() => {
    loadFeedPosts();
  }, [loadFeedPosts]);

  // Instagram-style Infinite Scroll via IntersectionObserver
  useEffect(() => {
    const observerTarget = bottomObserverRef.current;
    if (!observerTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedHasMore && !feedLoading && !feedLoadingMore) {
          loadMoreFeedPosts();
        }
      },
      {
        rootMargin: "300px", // Foydalanuvchi pastga yetmasidan oldinroq keyingi 15 tani yuklash
        threshold: 0.1,
      }
    );

    observer.observe(observerTarget);

    return () => {
      if (observerTarget) observer.unobserve(observerTarget);
    };
  }, [feedHasMore, feedLoading, feedLoadingMore, loadMoreFeedPosts]);

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
          <>
            {feedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onOpenComments={(p) => setActiveCommentsPost(p)}
                onLikeToggled={handleFeedLikeToggled}
              />
            ))}

            {/* Bottom loader & Infinite Scroll Trigger */}
            <div
              ref={bottomObserverRef}
              className="feed-bottom-trigger"
              style={{ padding: "20px 0", textAlign: "center" }}
            >
              {feedLoadingMore && (
                <div className="feed-loading-more">
                  <FaSpinner className="spinner-anim" />
                  <span>Keyingi postlar yuklanmoqda...</span>
                </div>
              )}
              {!feedHasMore && feedPosts.length > 0 && (
                <div className="feed-end-message" style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "16px 0" }}>
                  🎉 Barcha yangi postlarni ko'rib bo'ldingiz!
                </div>
              )}
            </div>
          </>
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
