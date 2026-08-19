import React, { useState } from "react";
import { FaHeart, FaComment, FaImages, FaPlus } from "react-icons/fa";
import PostCard from "../feed/PostCard";
import CommentsModal from "../feed/CommentsModal";

function UserPostsGrid({ posts, onOpenCreatePost }) {
  const [selectedPost, setSelectedPost] = useState(null);
  const [activeCommentsPost, setActiveCommentsPost] = useState(null);

  if (!posts || posts.length === 0) {
    return (
      <div className="user-posts-empty">
        <div className="empty-icon-circle">
          <FaImages />
        </div>
        <h3>Hozircha hech qanday post yo'q</h3>
        <p>Ilk suratlaringiz va qiziqarli lahzalaringizni boshqalar bilan ulashing!</p>
        <button className="empty-create-post-btn" onClick={onOpenCreatePost}>
          <FaPlus /> Birinchi postni yaratish
        </button>
      </div>
    );
  }

  return (
    <div className="user-posts-grid-container fade-in-content">
      <div className="posts-thumbnails-grid">
        {posts.map((post) => {
          const firstImg =
            Array.isArray(post.images) && post.images.length > 0
              ? post.images[0]
              : "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80";

          return (
            <div
              key={post.id}
              className="post-thumbnail-item"
              onClick={() => setSelectedPost(post)}
            >
              <img src={firstImg} alt="Thumbnail" loading="lazy" />

              {/* Multi-image indicator */}
              {Array.isArray(post.images) && post.images.length > 1 && (
                <div className="grid-multi-badge">
                  <FaImages />
                </div>
              )}

              {/* Hover overlay with like and comment counts */}
              <div className="grid-hover-overlay">
                <span className="grid-stat">
                  <FaHeart /> {post.likes_count || 0}
                </span>
                <span className="grid-stat">
                  <FaComment /> {post.comments_count || 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Post Modal Viewer */}
      {selectedPost && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="post-detail-modal scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <PostCard
              post={selectedPost}
              onOpenComments={(p) => setActiveCommentsPost(p)}
            />
          </div>
        </div>
      )}

      {/* Comments Drawer/Modal */}
      {activeCommentsPost && (
        <CommentsModal
          isOpen={Boolean(activeCommentsPost)}
          post={activeCommentsPost}
          onClose={() => setActiveCommentsPost(null)}
        />
      )}
    </div>
  );
}

export default UserPostsGrid;
