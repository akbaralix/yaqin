import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaCamera,
  FaComments,
  FaFutbol,
  FaBookOpen,
  FaPlane,
  FaCode,
  FaMusic,
  FaGamepad,
  FaFilm,
  FaDumbbell,
  FaUtensils,
  FaPalette,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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

const interestsList = [
  { id: "chat", name: "Suhbatlashish", icon: <FaComments /> },
  { id: "sport", name: "Sport & Fitnes", icon: <FaDumbbell /> },
  { id: "football", name: "Futbol", icon: <FaFutbol /> },
  { id: "reading", name: "Kitobxonlik", icon: <FaBookOpen /> },
  { id: "travel", name: "Sayohat", icon: <FaPlane /> },
  { id: "coding", name: "Dasturlash", icon: <FaCode /> },
  { id: "music", name: "Musiqa", icon: <FaMusic /> },
  { id: "gaming", name: "O'yinlar (Gaming)", icon: <FaGamepad /> },
  { id: "movies", name: "Kino & Seriallar", icon: <FaFilm /> },
  { id: "photo", name: "Suratga olish", icon: <FaCamera /> },
  { id: "cooking", name: "Kulinariya", icon: <FaUtensils /> },
  { id: "art", name: "Rasm chizish / San'at", icon: <FaPalette /> },
];

function EditProfileModal({ isOpen, onClose, onProfileUpdated }) {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [bio, setBio] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [region, setRegion] = useState("");
  const [gender, setGender] = useState("male");
  const [interests, setInterests] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // MANTIQIY XATO 2 TUZATILDI: State'larni user o'zgarganda doim yangilash
  useEffect(() => {
    if (user && isOpen) {
      setFirstName(user.first_name || "");
      setBio(user.bio || "");
      setBirthDate(user.birth_date || "");
      setRegion(user.region || "");
      setGender(user.gender || "male");
      setInterests(Array.isArray(user.interests) ? user.interests : []);
      setAvatarPreview(user.profile_pic || null);
      setAvatarFile(null);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const toggleInterest = (name) => {
    if (interests.includes(name)) {
      setInterests(interests.filter((i) => i !== name));
    } else {
      setInterests([...interests, name]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("Ismingizni kiriting!");
      return;
    }
    if (bio.trim().length < 10) {
      toast.error("Bio ga o'zingiz haqingizda kamida 10 ta belgi yozing!");
      return;
    }
    if (interests.length < 3) {
      toast.error("Kamida 3 ta qiziqishni tanlang!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("bio", bio.trim());
      if (birthDate) formData.append("birthDate", birthDate);
      if (region) formData.append("region", region);
      if (gender) formData.append("gender", gender);
      formData.append("interests", JSON.stringify(interests));

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await api.updateProfile(formData);

      if (res?.success) {
        toast.success("Profil muvaffaqiyatli yangilandi! ✨");
        await refreshUser();
        if (onProfileUpdated) onProfileUpdated(res.user);
        onClose();
      } else {
        toast.error(res?.error || "Yangilashda xatolik");
      }
    } catch (err) {
      console.error("Update profile error:", err);
      toast.error(err.message || "Serverga ulanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="edit-profile-modal scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Profilni tahrirlash</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* Avatar Upload */}
          <div className="edit-avatar-section">
            <div className="edit-avatar-preview-box">
              <img
                src={
                  avatarPreview ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Avatar"
              />
              <label
                htmlFor="edit-avatar-input"
                className="avatar-edit-icon-overlay"
              >
                <FaCamera />
              </label>
              <input
                id="edit-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </div>
            <span className="avatar-hint">Yangi rasm yuklash uchun bosing</span>
          </div>

          {/* First Name */}
          <div className="form-group">
            <label>Ismingiz *</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Bio / O'zingiz haqingizda</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="O'zingiz haqingizda qiziqarli ma'lumotlar yozing..."
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Tug'ilgan sana</label>
              {/* MANTIQIY XATO 1 TUZATILDI: max="2026-12-31" */}
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                min="1950-01-01"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Region */}
            <div className="form-group">
              <label>Viloyat</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">Tanlang</option>
                {viloyatlar.map((v, idx) => (
                  <option key={idx} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div className="form-group">
            <label>Jins</label>
            <div className="gender-container">
              <button
                type="button"
                className={`gender-btn ${gender === "male" ? "active" : ""}`}
                onClick={() => setGender("male")}
              >
                Erkak 👨
              </button>
              <button
                type="button"
                className={`gender-btn ${gender === "female" ? "active" : ""}`}
                onClick={() => setGender("female")}
              >
                Ayol 👩
              </button>
            </div>
          </div>

          {/* Interests */}
          <div className="form-group">
            <label>Qiziqishlar ({interests.length} ta)</label>
            <div className="interests-grid small-grid">
              {interestsList.map((item) => {
                const isSelected = interests.includes(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`interest-card ${isSelected ? "active" : ""}`}
                    onClick={() => toggleInterest(item.name)}
                  >
                    <span className="icon">{item.icon}</span>
                    <span className="name">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              <FaTimes />
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;
