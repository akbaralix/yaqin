import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { FaHeart, FaComments, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function MatchModal({ matchUser, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fire celebratory confetti explosion
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff3366", "#7e3ef6", "#ffb800", "#00d2ff"],
      });
    } catch (e) {
      console.warn("Confetti effect warn:", e);
    }
  }, []);

  if (!matchUser) return null;

  return (
    <div className="match-modal-overlay" onClick={onClose}>
      <div
        className="match-modal-content scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="match-modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="match-badge">🎉 It's a Match!</div>
        <h2 className="match-title">Tabriklaymiz!</h2>
        <p className="match-subtitle">
          Siz va <b>{matchUser.first_name}</b> bir-biringizga yoqdingiz!
        </p>

        {/* Avatars Clash */}
        <div className="match-avatars-row">
          <div className="match-avatar-circle left">
            <img
              src={
                user?.profile_pic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={user?.first_name || "Siz"}
            />
          </div>
          <div className="match-heart-pulse">
            <FaHeart />
          </div>
          <div className="match-avatar-circle right">
            <img
              src={
                matchUser.profile_pic ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={matchUser.first_name}
            />
          </div>
        </div>

        <div className="match-buttons-row">
          <button
            className="match-chat-btn"
            onClick={() => {
              onClose();
              navigate("/matches");
            }}
          >
            <FaComments /> Suhbatni boshlash
          </button>
          <button className="match-keep-swiping-btn" onClick={onClose}>
            Tanishuvni davom ettirish
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchModal;
