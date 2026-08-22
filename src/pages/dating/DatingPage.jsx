import React, { useState, useEffect } from "react";
import SwipeCard from "../../components/dating/SwipeCard";
import MatchModal from "../../components/dating/MatchModal";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useDataCache } from "../../context/DataCacheContext";
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
  const {
    candidates,
    datingLoading,
    datingFilters,
    loadCandidates,
    initDatingFilters,
    updateDatingFilters,
    removeCandidateLocally,
  } = useDataCache();

  const [activeMatchUser, setActiveMatchUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Default jinsni foydalanuvchining qarama-qarshi jinsiga sozlaymiz
  const defaultGender =
    user?.gender === "male"
      ? "female"
      : user?.gender === "female"
        ? "male"
        : "all";

  // Filtrlarni birinchi marta initialize qilamiz
  useEffect(() => {
    initDatingFilters({
      gender: defaultGender,
      region: "all",
      ageMin: "",
      ageMax: "",
    });
  }, [initDatingFilters, defaultGender]);

  // Kesh bo'lsa yuklamaydi, yo'q bo'lsa yuklaydi
  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const handleSwipe = async (targetId, action) => {
    const candidate = candidates.find((c) => c.user_id === targetId);

    // Remove candidate from local stack immediately
    removeCandidateLocally(targetId);

    try {
      const res = await api.swipeCandidate(targetId, action);

      if (res?.isMatch) {
        setActiveMatchUser(res.matchedUser || candidate);
      } else if (action === "like") {
        toast.success("Yoqdi! ❤️ Agar u ham yoqtirsa, match bo'ladi");
      }
    } catch (err) {
      console.error("Swipe action error:", err);
    }
  };

  // Filtrlarni lokal boshqarish — context'ga yozish
  const filters = datingFilters || {
    gender: defaultGender,
    region: "all",
    ageMin: "",
    ageMax: "",
  };

  const targetGenderText =
    filters.gender === "female"
      ? "Ayollar profillari"
      : filters.gender === "male"
        ? "Erkaklar profillari"
        : "Barcha profillar";

  return (
    <div className="dating-page-container">
      <div className="dating-top-bar">
        <div className="dating-title-box">
          <h2>
            <FaFire className="dating-fire-icon" /> Tanishuv
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
            {/* Jins bo'yicha filtr */}
            <div className="filter-item">
              <label>Jins:</label>
              <select
                value={filters.gender}
                onChange={(e) =>
                  updateDatingFilters({ gender: e.target.value })
                }
              >
                <option value="all">Barchasi</option>
                <option value="female">Ayollar</option>
                <option value="male">Erkaklar</option>
              </select>
            </div>

            {/* Viloyat bo'yicha filtr */}
            <div className="filter-item">
              <label>Viloyat:</label>
              <select
                value={filters.region}
                onChange={(e) =>
                  updateDatingFilters({ region: e.target.value })
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

            {/* Yosh oralig'i */}
            <div className="filter-item">
              <label>Yosh oralig'i:</label>
              <div className="age-inputs-row">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.ageMin}
                  onChange={(e) =>
                    updateDatingFilters({ ageMin: e.target.value })
                  }
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Maks"
                  value={filters.ageMax}
                  onChange={(e) =>
                    updateDatingFilters({ ageMax: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dating Cards Stack */}
      <div className="dating-cards-stage">
        {datingLoading ? (
          <div className="dating-loading-state">
            <FaSpinner className="spinner-anim" />
            <p>Sizga mos yangi profillar izlanmoqda...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="dating-empty-card fade-in-content">
            <div className="empty-fire-circle">
              <img src="/utya-duck-icon/utyaduckicon12.png" alt="" />
            </div>
            <h3>Hozircha yangi nomzodlar qolmadi</h3>
            <p>
              Siz mavjud barcha tavsiya etilgan profillarni ko'rib chiqdingiz.
              Filtrlarni o'zgartirib ko'ring yoki keyinroq qayta kiring!
            </p>
            <button className="reload-candidates-btn" onClick={() => loadCandidates(true)}>
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
