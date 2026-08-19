import React, { useState, useRef } from "react";
import {
  FaTimes,
  FaHeart,
  FaStar,
  FaMapMarkerAlt,
  FaInfoCircle,
} from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";

function SwipeCard({ candidate, onSwipe, isTop }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  if (!candidate) return null;

  // Touch & Mouse Drag Handlers
  const handleTouchStart = (e) => {
    if (!isTop) return;
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isTop) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPosRef.current.x;
    const dy = touch.clientY - startPosRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);

    if (dragOffset.x > 110) {
      // Swiped Right -> Like
      onSwipe(candidate.user_id, "like");
    } else if (dragOffset.x < -110) {
      // Swiped Left -> Skip
      onSwipe(candidate.user_id, "skip");
    } else {
      // Reset
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Mouse Handlers (Desktop drag)
  const handleMouseDown = (e) => {
    if (!isTop) return;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isTop) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handleMouseUp = () => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);

    if (dragOffset.x > 120) {
      onSwipe(candidate.user_id, "like");
    } else if (dragOffset.x < -120) {
      onSwipe(candidate.user_id, "skip");
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const rotateDeg = dragOffset.x * 0.08;
  const cardStyle = isTop
    ? {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotateDeg}deg)`,
        transition: isDragging ? "none" : "transform 0.3s ease",
        cursor: isDragging ? "grabbing" : "grab",
      }
    : {};

  // Decision Stamp opacity
  const likeOpacity = Math.min(Math.max(dragOffset.x / 100, 0), 1);
  const skipOpacity = Math.min(Math.max(-dragOffset.x / 100, 0), 1);

  return (
    <div
      className={`dating-swipe-card ${isTop ? "is-top" : "is-background"}`}
      style={cardStyle}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => isDragging && handleMouseUp()}
    >
      {/* Swipe Stamp indicators */}
      {isTop && (
        <>
          <div
            className="swipe-stamp stamp-like"
            style={{ opacity: likeOpacity }}
          >
            LIKE ❤️
          </div>
          <div
            className="swipe-stamp stamp-skip"
            style={{ opacity: skipOpacity }}
          >
            NOPE ❌
          </div>
        </>
      )}

      {/* Candidate Photo */}
      <div className="dating-card-image-wrapper">
        <img
          src={
            candidate.profile_pic ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          }
          alt={candidate.first_name}
          className="dating-card-image"
          draggable="false"
        />

        {/* Compatibility badge */}
        {candidate.compatibility && (
          <div className="dating-compatibility-pill">
            <IoSparkles /> {candidate.compatibility}% moslik
          </div>
        )}

        <div className="dating-card-gradient" />
      </div>

      {/* Candidate Details Overlay */}
      <div className="dating-card-info">
        <div className="dating-name-row">
          <h3 className="dating-user-name">
            {candidate.first_name}
            {candidate.age && <span className="dating-age">, {candidate.age}</span>}
          </h3>
          <button
            className="info-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullBio(!showFullBio);
            }}
          >
            <FaInfoCircle />
          </button>
        </div>

        <div className="dating-user-location">
          <FaMapMarkerAlt /> {candidate.region || "O'zbekiston"}
        </div>

        {candidate.bio && (
          <p
            className={`dating-user-bio ${showFullBio ? "expanded" : ""}`}
            onClick={() => setShowFullBio(!showFullBio)}
          >
            {candidate.bio}
          </p>
        )}

        {/* Interest tags */}
        {Array.isArray(candidate.interests) &&
          candidate.interests.length > 0 && (
            <div className="dating-interests-row">
              {candidate.interests.slice(0, 4).map((interest, idx) => {
                const isShared = candidate.sharedInterests?.some(
                  (si) => si.toLowerCase() === interest.toLowerCase()
                );
                return (
                  <span
                    key={idx}
                    className={`dating-interest-tag ${isShared ? "shared" : ""}`}
                  >
                    {interest} {isShared && "✨"}
                  </span>
                );
              })}
            </div>
          )}
      </div>

      {/* Action Buttons (Visible on Top Card) */}
      {isTop && (
        <div className="dating-actions-bar" onClick={(e) => e.stopPropagation()}>
          <button
            className="dating-action-btn skip"
            onClick={() => onSwipe(candidate.user_id, "skip")}
            title="O'tkazib yuborish"
          >
            <FaTimes />
          </button>

          <button
            className="dating-action-btn superlike"
            onClick={() => onSwipe(candidate.user_id, "superlike")}
            title="Super Like"
          >
            <FaStar />
          </button>

          <button
            className="dating-action-btn like"
            onClick={() => onSwipe(candidate.user_id, "like")}
            title="Yoqdi (Like)"
          >
            <FaHeart />
          </button>
        </div>
      )}
    </div>
  );
}

export default SwipeCard;
