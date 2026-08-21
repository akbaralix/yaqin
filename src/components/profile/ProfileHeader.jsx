import React, { useState } from "react";
import {
  FaMapMarkerAlt,
  FaEdit,
  FaChartLine,
  FaTh,
  FaCalendarAlt,
} from "react-icons/fa";
import fmale from "/gender-icon/fmale/fmale-icon5.jpg";
import male from "/gender-icon/male/male-icon3.jpg";
import StickerPicker from "./StickerPicker";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

function ProfileHeader({ user, activeTab, onTabChange, onOpenEdit }) {
  const { refreshUser } = useAuth();
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);

  if (!user) return null;

  const handleStickerSelect = async (sticker) => {
    try {
      const formData = new FormData();
      formData.append("profileSticker", sticker || "");
      const res = await api.updateProfile(formData);
      if (res?.success) {
        await refreshUser();
        toast.success(
          sticker ? "Stiker o'rnatildi! ✨" : "Stiker olib tashlandi",
        );
      }
    } catch (err) {
      console.error("Sticker update error:", err);
      toast.error("Stikerni saqlashda xatolik");
    }
  };

  return (
    <div className="profile-header-card">
      <div className="profile-banner-bg" />

      <div className="profile-main-meta">
        <div className="profile-avatar-wrapper">
          <img
            src={
              user.profile_pic ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt={user.first_name || "Profile"}
            className="profile-big-avatar"
          />
          {user.gender && (
            <img
              className={`gender-badge ${user.gender}`}
              title={user.gender === "male" ? "Erkak" : "Ayol"}
              src={user.gender === "male" ? male : fmale}
            ></img>
          )}
        </div>

        <div className="profile-names-section">
          <div className="profile-title-row">
            <div className="profile-full-name">
              {/* Profile Sticker Badge - click to open picker */}
              <h1>{user.first_name}</h1>{" "}
              <button
                className="profile-sticker-badge"
                onClick={() => setIsStickerPickerOpen(true)}
                title="Stiker o'rnatish / o'zgartirish"
              >
                {user.profile_sticker ? (
                  <img
                    className="sticker-badge-img"
                    src={user.profile_sticker}
                    alt="stiker"
                  />
                ) : (
                  <span className="sticker-placeholder">＋</span>
                )}
              </button>
              {user.age && (
                <span className="profile-age"> ● {user.age} yosh</span>
              )}
            </div>
            <button className="profile-edit-btn" onClick={onOpenEdit}>
              <FaEdit /> Profilni tahrirlash
            </button>
          </div>

          <div className="profile-info-badges">
            {user.region && (
              <span className="info-pill">
                <FaMapMarkerAlt /> {user.region}
              </span>
            )}
            {user.birth_date && (
              <span className="info-pill">
                <FaCalendarAlt /> {user.birth_date}
              </span>
            )}
          </div>

          {user.bio ? (
            <p className="profile-bio-text">{user.bio}</p>
          ) : (
            <p className="profile-bio-empty">
              O'zingiz haqingizda ma'lumot kiritilmagan. "Profilni tahrirlash"
              orqali qo'shing.
            </p>
          )}

          {/* Interests Pills */}
          {Array.isArray(user.interests) && user.interests.length > 0 && (
            <div className="profile-interests-wrapper">
              <span className="interests-header-tag">Qiziqishlar:</span>
              <div className="profile-interests-chips">
                {user.interests.map((tag, idx) => (
                  <span key={idx} className="interest-pill">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Tabs Navigation (Posts Grid vs Analytics) */}
      <div className="profile-tabs-nav">
        <button
          className={`profile-tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => onTabChange("posts")}
        >
          <FaTh />
          <span>Postlarim ({user.stats?.totalPosts || 0})</span>
        </button>

        <button
          className={`profile-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => onTabChange("analytics")}
        >
          <FaChartLine />
          <span>Statistika</span>
        </button>
      </div>

      {/* Sticker Picker Modal */}
      <StickerPicker
        isOpen={isStickerPickerOpen}
        onClose={() => setIsStickerPickerOpen(false)}
        onSelect={handleStickerSelect}
        currentSticker={user.profile_sticker}
      />
    </div>
  );
}

export default ProfileHeader;
