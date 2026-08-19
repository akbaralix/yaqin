import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaComments,
  FaFire,
  FaMapMarkerAlt,
  FaSpinner,
  FaPaperPlane,
} from "react-icons/fa";
import { api } from "../../services/api";
import toast from "react-hot-toast";

function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState({});

  useEffect(() => {
    async function loadMatches() {
      try {
        const res = await api.getMatches();
        if (res?.matches) {
          setMatches(res.matches);
        }
      } catch (err) {
        console.warn("Matches load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !chatUser) return;

    const userKey = chatUser.user_id;
    const newMsg = {
      sender: "me",
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatHistory((prev) => ({
      ...prev,
      [userKey]: [...(prev[userKey] || []), newMsg],
    }));

    setChatMessage("");
    toast.success("Xabar yuborildi!");
  };

  return (
    <div className="matches-page-container fade-in-content">
      <div className="matches-header">
        <h2>
          <FaFire className="fire-icon" /> Matchlarim va Suhbatlar ({matches.length})
        </h2>
        <p>Bir-biringizga yoqqan insonlar bilan xabar almashishni boshlang</p>
      </div>

      {loading ? (
        <div className="matches-loading">
          <FaSpinner className="spinner-anim" />
          <p>Matchlar yuklanmoqda...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="matches-empty-state">
          <div className="empty-heart-box">
            <FaHeart />
          </div>
          <h3>Hozircha o'zaro matchlar yo'q</h3>
          <p>
            Tanishuv (Swipe) bo'limiga o'ting va yoqqan profillarga Like bosing.
            Ular ham sizni yoqtirishganda bu yerda paydo bo'ladi!
          </p>
          <Link to="/dating" className="go-swipe-btn">
            <FaFire /> Tanishuvni boshlash
          </Link>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((m) => (
            <div key={m.match_id} className="match-card">
              <img
                src={
                  m.user.profile_pic ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt={m.user.first_name}
                className="match-card-avatar"
              />
              <div className="match-card-details">
                <div className="match-name-row">
                  <h4>{m.user.first_name}</h4>
                  {m.user.age && <span>, {m.user.age}</span>}
                </div>
                <span className="match-region">
                  <FaMapMarkerAlt /> {m.user.region || "O'zbekiston"}
                </span>

                {m.user.bio && (
                  <p className="match-bio-excerpt">{m.user.bio}</p>
                )}

                <button
                  className="start-chat-btn"
                  onClick={() => setChatUser(m.user)}
                >
                  <FaComments /> Suhbatlashish
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mini Chat Drawer / Modal */}
      {chatUser && (
        <div className="modal-overlay" onClick={() => setChatUser(null)}>
          <div
            className="chat-modal scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="chat-header">
              <div className="chat-user-header-info">
                <img
                  src={
                    chatUser.profile_pic ||
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  alt={chatUser.first_name}
                />
                <div>
                  <h4>{chatUser.first_name}</h4>
                  <span className="online-indicator">🟢 Onlayn</span>
                </div>
              </div>
              <button
                className="close-chat-btn"
                onClick={() => setChatUser(null)}
              >
                ✕
              </button>
            </div>

            <div className="chat-messages-body">
              <div className="match-start-notice">
                🎉 Siz va <b>{chatUser.first_name}</b> bir-biringizga yoqdingiz!
                Suhbatni birinchi bo'lib boshlang.
              </div>

              {(chatHistory[chatUser.user_id] || []).map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.sender}`}>
                  <p>{msg.text}</p>
                  <span className="chat-time">{msg.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                placeholder="Xabaringizni yozing..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchesPage;
