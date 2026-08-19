import React, { useState, useEffect, useCallback } from "react";
import SwipeCard from "../../components/dating/SwipeCard";
import MatchModal from "../../components/dating/MatchModal";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
  FaFire,
  FaHeart,
  FaRedo,
  FaSlidersH,
  FaVenusMars,
  FaSpinner,
} from "react-icons/fa";

const viloyatlar = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon",
  "Buxoro",
  "Farg'ona",
  "Jizzax",
  "Xorazm",
  "Namangan",
  "Navoiy",
  "Qashqadaryo",
  "Samarqand",
  "Sirdaryo",
  "Surxondaryo",
  "Qoraqalpog'iston Res.",
];

function DatingPage() {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMatchUser, setActiveMatchUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    region: "all",
    ageMin: "",
    ageMax: "",
  });

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getDatingCards(filters);
      if (res?.candidates) {
        setCandidates(res.candidates);
      }
    } catch (err) {
      console.warn("Failed to load candidates:", err);
      toast.error("Tanishuv profillarini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleSwipe = async (targetId, action) => {
    const candidate = candidates.find((c) => c.user_id === targetId);

    // Remove candidate from local stack immediately
    setCandidates((prev) => prev.filter((c) => c.user_id !== targetId));

    try {
      const res = await api.swipeCandidate(targetId, action);

      if (res?.isMatch) {
        // Trigger Match modal celebration!
        setActiveMatchUser(res.matchedUser || candidate);
      } else if (action === "like") {
        toast.success("Yoqdi! ❤️ Agar u ham yoqtirsa, match bo'ladi");
      }
    } catch (err) {
      console.error("Swipe action error:", err);
    }
  };

  const targetGenderText =
    user?.gender === "male"
      ? "Ayollar profillari"
      : user?.gender === "female"
      ? "Erkaklar profillari"
      : "Barcha profillar";

  return (
    <div className="dating-page-container">
      {/* Dating Header Bar */}
      <div className="dating-top-bar">
        <div className="dating-title-box">
          <h2>
            <FaFire className="dating-fire-icon" /> Tanishuv (Swipe)
          </h2>
          <span className="dating-gender-badge">
            <FaVenusMars /> {targetGenderText}
          </span>
        </div>

        <button
          className={`dating-filter-toggle ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaSlidersH /> Filtr
        </button>
      </div>

      {/* Dating Filters Drawer */}
      {showFilters && (
        <div className="dating-filters-box fade-in-content">
          <div className="filter-row">
            <div className="filter-item">
              <label>Viloyat:</label>
              <select
                value={filters.region}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, region: e.target.value }))
                }
              >
                <option value="all">Barcha viloyatlar</option>
                {viloyatlar.map((v, i) => (
                  <option key={i} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Yosh oralig'i:</label>
              <div className="age-inputs-row">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.ageMin}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, ageMin: e.target.value }))
                  }
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Maks"
                  value={filters.ageMax}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, ageMax: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dating Cards Stack */}
      <div className="dating-cards-stage">
        {loading ? (
          <div className="dating-loading-state">
            <FaSpinner className="spinner-anim" />
            <p>Sizga mos yangi profillar izlanmoqda...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="dating-empty-card fade-in-content">
            <div className="empty-fire-circle">
              <FaHeart />
            </div>
            <h3>Hozircha yangi nomzodlar qolmadi</h3>
            <p>
              Siz mavjud barcha tavsiya etilgan profillarni ko'rib chiqdingiz.
              Filtrlarni o'zgartirib ko'ring yoki keyinroq qayta kiring!
            </p>
            <button className="reload-candidates-btn" onClick={loadCandidates}>
              <FaRedo /> Qaytadan tekshirish
            </button>
          </div>
        ) : (
          <div className="cards-stack-wrapper">
            {candidates
              .slice(0, 3)
              .reverse()
              .map((candidate, index, arr) => {
                const isTop = index === arr.length - 1;
                return (
                  <SwipeCard
                    key={candidate.user_id}
                    candidate={candidate}
                    onSwipe={handleSwipe}
                    isTop={isTop}
                  />
                );
              })}
          </div>
        )}
      </div>

      {/* Celebratory Match Modal */}
      {activeMatchUser && (
        <MatchModal
          matchUser={activeMatchUser}
          onClose={() => setActiveMatchUser(null)}
        />
      )}
    </div>
  );
}

export default DatingPage;
