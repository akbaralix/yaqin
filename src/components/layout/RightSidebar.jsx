import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaMapMarkerAlt } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import { api } from "../../services/api";

function RightSidebar() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSuggestions() {
      try {
        const res = await api.getDatingCards();
        if (res?.candidates) {
          setSuggestions(res.candidates.slice(0, 4));
        }
      } catch (err) {
        console.warn("Suggestions error:", err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSuggestions();
  }, []);

  return (
    <aside className="app-right-sidebar">
      {/* Suggestions Section */}
      <div className="right-card suggestions-card">
        <div className="right-card-header">
          <span className="right-card-title">
            <IoSparkles className="header-icon" /> Sizga mos tanishuvlar
          </span>
          <Link to="/dating" className="see-all-link">
            Barchasi
          </Link>
        </div>

        {loading ? (
          <div className="suggestions-skeleton">
            <div className="skeleton-item"></div>
            <div className="skeleton-item"></div>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="no-suggestions-text">Hozircha yangi tavsiyalar yo'q</p>
        ) : (
          <div className="suggestions-list">
            {suggestions.map((person) => {
              const profileLink = person.username
                ? `/${person.username}`
                : `/${person.user_id}`;

              return (
                <div key={person.user_id} className="suggestion-item">
                  <Link to={profileLink}>
                    <img
                      src={
                        person.profile_pic ||
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      alt={person.first_name}
                      className="suggestion-avatar"
                    />
                  </Link>
                  <Link to={profileLink} className="suggestion-details suggestion-link-wrapper">
                    <div className="suggestion-name-row">
                      <span className="suggestion-name">{person.first_name}</span>
                      {person.username && (
                        <span className="suggestion-username"> @{person.username}</span>
                      )}
                      {person.age && (
                        <span className="suggestion-age">, {person.age}</span>
                      )}
                    </div>
                    <span className="suggestion-region">
                      <FaMapMarkerAlt /> {person.region || "O'zbekiston"}
                    </span>
                    {person.compatibility && (
                      <span className="compatibility-badge">
                        {person.compatibility}% mos
                      </span>
                    )}
                  </Link>
                  <Link to="/dating" className="quick-swipe-link" title="Tanishish">
                    <FaHeart />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Community Tips */}
      <div className="right-card community-card">
        <h4>💡 Yaqin maslahati</h4>
        <p>
          Profilingizga samimiy bio va 2-3 ta sifatli rasm qo'shsangiz, mos
          tanishuvlar ehtimoli <b>3 barobarga</b> oshadi!
        </p>
        <Link to="/profile" className="improve-profile-btn">
          Profilni yaxshilash
        </Link>
      </div>

      <div className="right-footer-links">
        <span>© 2026 Yaqin Network</span>
        <span>•</span>
        <span>Maxfiylik</span>
        <span>•</span>
        <span>Yordam</span>
      </div>
    </aside>
  );
}

export default RightSidebar;
