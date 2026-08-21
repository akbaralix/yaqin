import React, { useState, useRef } from "react";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaMapMarkerAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import toast from "react-hot-toast";
import { api } from "../../services/api";

function PostCard({ post, onOpenComments, onLikeToggled }) {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(post.hasLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const images =
    Array.isArray(post.images) && post.images.length > 0
      ? post.images
      : [
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
        ];

  const handlePrevImg = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImg = (e) => {
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleToggleLike = async (e) => {
    if (e) e.stopPropagation();
    if (isLikeLoading) return;

    // Optimistic UI update
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      setIsLikeLoading(true);
      const res = await api.toggleLikePost(post.id);
      if (res?.success) {
        setIsLiked(res.hasLiked);
        setLikesCount(res.likesCount);
        if (onLikeToggled) onLikeToggled(post.id, res.hasLiked, res.likesCount);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
      toast.error("Like amali bajarilmadi");
    } finally {
      setIsLikeLoading(false);
    }
  };

  // Double tap to like on image
  const lastTapRef = useRef(0);
  const handleImageDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
      if (!isLiked) {
        handleToggleLike();
      }
    }
    lastTapRef.current = now;
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Post havolasi nusxalandi!");
    } else {
      toast.success("Havola nusxalandi!");
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const diffHours = Math.floor(
      (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60),
    );
    if (diffHours < 1) return "Hozirgina";
    if (diffHours < 24) return `${diffHours} soat oldin`;
    return `${Math.floor(diffHours / 24)} kun oldin`;
  };

  return (
    <article className="post-card">
      {/* Post Author Header */}
      <header className="post-header">
        <div className="post-author-info">
          <img
            src={
              post.author?.profile_pic ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt={post.author?.first_name || "Author"}
            className="post-author-avatar"
          />
          <div className="post-author-meta">
            <div className="post-author-name-row">
              {post.author?.profile_sticker && (
                <img className="post-author-sticker-img" src={post.author.profile_sticker} alt="stiker" />
              )}
              <span className="post-author-name">
                {post.author?.first_name || "Foydalanuvchi"}
              </span>
              {post.author?.age && (
                <span className="post-author-age">, {post.author.age}</span>
              )}
            </div>
            <div className="post-sub-info">
              {post.location ? (
                <span className="post-location">
                  <FaMapMarkerAlt /> {post.location}
                </span>
              ) : post.author?.region ? (
                <span className="post-location">
                  <FaMapMarkerAlt /> {post.author.region}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Recommendation Score / Shared Interests Badge */}
        {post.recommendationScore && post.recommendationScore > 75 && (
          <div
            className="recommendation-badge"
            title="Sizning qiziqishlaringiz va joylashuvingizga mos"
          >
            <IoSparkles /> Sizga mos
          </div>
        )}
      </header>

      {/* Image Carousel (1 to 10 images) */}
      <div className="post-carousel-container" onClick={handleImageDoubleTap}>
        <img
          src={images[currentImgIndex]}
          alt={`Post visual ${currentImgIndex + 1}`}
          className="post-carousel-image"
          loading="lazy"
        />

        {/* Double click heart explosion animation */}
        {showHeartAnim && (
          <div className="carousel-heart-anim">
            <FaHeart />
          </div>
        )}

        {/* Multi-image indicators & navigation */}
        {images.length > 1 && (
          <>
            <button
              className="carousel-arrow left"
              onClick={handlePrevImg}
              aria-label="Oldingi rasm"
            >
              <FaChevronLeft />
            </button>
            <button
              className="carousel-arrow right"
              onClick={handleNextImg}
              aria-label="Keyingi rasm"
            >
              <FaChevronRight />
            </button>

            <div className="carousel-counter-tag">
              {currentImgIndex + 1}/{images.length}
            </div>

            <div className="carousel-dots">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`carousel-dot ${idx === currentImgIndex ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIndex(idx);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Actions Row */}
      <div className="post-actions-row">
        <div className="left-actions">
          <button
            className={`action-icon-btn ${isLiked ? "liked" : ""}`}
            onClick={handleToggleLike}
            aria-label="Like"
          >
            {isLiked ? <FaHeart className="heart-filled" /> : <FaRegHeart />}
            <span className="action-count">{likesCount}</span>
          </button>

          <button
            className="action-icon-btn"
            onClick={() => onOpenComments && onOpenComments(post)}
            aria-label="Izohlar"
          >
            <FaComment />
            <span className="action-count">{post.comments_count || 0}</span>
          </button>

          <button
            className="action-icon-btn"
            onClick={handleShare}
            aria-label="Ulashish"
          >
            <FaShare />
          </button>
        </div>
      </div>

      {/* Caption & Interests */}
      <div className="post-body">
        {post.caption && (
          <p className="post-caption">
            <span className="post-caption-author">
              {post.author?.profile_sticker && (
                <img className="post-author-sticker-img" src={post.author.profile_sticker} alt="stiker" />
              )}
              {post.author?.first_name} :
            </span>{" "}
            {post.caption}
          </p>
        )}

        {/* Author Interests tags preview */}
        {Array.isArray(post.author?.interests) &&
          post.author.interests.length > 0 && (
            <div className="post-interests-pills">
              {post.author.interests.slice(0, 3).map((tag, i) => (
                <span key={i} className="post-interest-pill">
                  #{tag}
                </span>
              ))}
            </div>
          )}

        {/* View all comments link */}
        {(post.comments_count || 0) > 0 && (
          <button
            className="view-comments-btn"
            onClick={() => onOpenComments && onOpenComments(post)}
          >
            Barcha {post.comments_count} ta izohni ko'rish...
          </button>
        )}
        <span className="post-time">{formatTime(post.created_at)}</span>
      </div>
    </article>
  );
}

export default PostCard;
