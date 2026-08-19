import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function CommentsModal({ isOpen, post, onClose, onCommentAdded }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !post?.id) return;

    async function loadComments() {
      setLoading(true);
      try {
        const res = await api.getPostComments(post.id);
        if (res?.comments) {
          setComments(res.comments);
        }
      } catch (err) {
        console.warn("Error loading comments:", err);
      } finally {
        setLoading(false);
      }
    }

    loadComments();
  }, [isOpen, post?.id]);

  useEffect(() => {
    if (!loading && comments.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, loading]);

  if (!isOpen || !post) return null;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.addPostComment(post.id, newComment);
      if (res?.comment) {
        setComments((prev) => [...prev, res.comment]);
        setNewComment("");
        if (onCommentAdded) onCommentAdded(post.id, res.comment);
      }
    } catch (err) {
      console.error("Add comment error:", err);
      toast.error(err.message || "Izoh qoldirishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const diffMin = Math.floor((Date.now() - new Date(isoString).getTime()) / (1000 * 60));
    if (diffMin < 1) return "Hozirgina";
    if (diffMin < 60) return `${diffMin} daq`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} soat`;
    return `${Math.floor(diffHr / 24)} kun`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="comments-modal scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Izohlar ({comments.length})</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Post Caption teaser */}
        {post.caption && (
          <div className="comments-post-summary">
            <img
              src={
                post.author?.profile_pic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={post.author?.first_name}
              className="comment-user-avatar"
            />
            <div className="comment-bubble post-author-bubble">
              <span className="comment-author-name">{post.author?.first_name}</span>
              <p className="comment-text">{post.caption}</p>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="comments-list">
          {loading ? (
            <div className="comments-loading">Izohlar yuklanmoqda...</div>
          ) : comments.length === 0 ? (
            <div className="no-comments">
              <p>Hozircha hech qanday izoh yo'q.</p>
              <span>Birinchi bo'lib fikr bildiring! ✨</span>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="comment-item">
                <img
                  src={
                    c.author_pic ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt={c.author_name}
                  className="comment-user-avatar"
                />
                <div className="comment-content">
                  <div className="comment-bubble">
                    <span className="comment-author-name">{c.author_name}</span>
                    <p className="comment-text">{c.text}</p>
                  </div>
                  <span className="comment-time">{formatTime(c.created_at)}</span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Comment Input */}
        <form onSubmit={handleAddComment} className="comment-form">
          <img
            src={
              user?.profile_pic ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt={user?.first_name}
            className="comment-input-avatar"
          />
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Izoh qoldiring..."
            disabled={submitting}
          />
          <button
            type="submit"
            className="comment-send-btn"
            disabled={submitting || !newComment.trim()}
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

export default CommentsModal;
