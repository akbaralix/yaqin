import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaComments,
  FaFutbol,
  FaBookOpen,
  FaPlane,
  FaCode,
  FaMusic,
  FaGamepad,
  FaFilm,
  FaDumbbell,
  FaCamera,
  FaUtensils,
  FaPalette,
} from "react-icons/fa";
import { IoArrowBackOutline, IoSparkles } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import "./login.css";

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

function CompleteProfile() {
  const { user, loginWithToken, isProfileComplete } = useAuth();
  const [complateType, setComplateType] = useState("step1");
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    birthDate: "",
    region: "",
    gender: "",
    bio: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (isProfileComplete) {
      navigate("/", { replace: true });
      return;
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.first_name || prev.firstName,
        region: user.region || prev.region,
        gender: user.gender || prev.gender,
        birthDate: user.birth_date || prev.birthDate,
        bio: user.bio || prev.bio,
      }));

      if (user.profile_pic) {
        setAvatarPreview(user.profile_pic);
      }

      if (Array.isArray(user.interests) && user.interests.length > 0) {
        setSelectedInterests(user.interests);
      }
    }
  }, [user, isProfileComplete, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenderSelect = (gender) => {
    setFormData((prev) => ({ ...prev, gender }));
  };

  const toggleInterest = (name) => {
    if (selectedInterests.includes(name)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== name));
    } else {
      setSelectedInterests([...selectedInterests, name]);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // 1-bosqichdan 2-bosqichga o'tish
  const handleNextStep = (e) => {
    e.preventDefault();

    if (!avatarFile && !avatarPreview) {
      toast.error("Iltimos, profil rasmingizni yuklang!");
      return;
    }
    if (!formData.firstName.trim()) {
      toast.error("Ismingizni kiriting!");
      return;
    }
    if (!formData.birthDate) {
      toast.error("Tug'ilgan sanangizni tanlang!");
      return;
    }
    if (!formData.region) {
      toast.error("Viloyatingizni tanlang!");
      return;
    }

    setComplateType("step2");
  };

  // Yakuniy saqlash (2-bosqichda)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.gender) {
      toast.error("Iltimos, jinsingizni tanlang!");
      return;
    }
    if (selectedInterests.length === 0) {
      toast.error("Kamida 1 ta qiziqishni tanlang!");
      return;
    }

    setLoading(true);

    const dataToSend = new FormData();
    dataToSend.append("firstName", formData.firstName);
    dataToSend.append("birthDate", formData.birthDate);
    dataToSend.append("region", formData.region);
    dataToSend.append("gender", formData.gender);
    dataToSend.append("bio", formData.bio || "");
    dataToSend.append("interests", JSON.stringify(selectedInterests));

    if (avatarFile) {
      dataToSend.append("avatar", avatarFile);
    }

    try {
      const result = await api.completeProfile(dataToSend);

      if (result.success && result.token) {
        // Update auth context and localStorage with new JWT token containing is_profile_complete: true
        loginWithToken(result.token, result.user);
        toast.success("Profil muvaffaqiyatli to'ldirildi! Xush kelibsiz 🎉");

        setComplateType("completed");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 1200);
      } else {
        toast.error(result.error || "Xatolik yuz berdi");
      }
    } catch (err) {
      console.error("So'rov yuborishda xatolik:", err);
      toast.error(err.message || "Serverga ulanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      {/* 1-BOSQICH: Rasm, Ism, Sana, Viloyat */}
      {complateType === "step1" && (
        <form className="complete-profile-card fade-in-content" onSubmit={handleNextStep}>
          <div className="step-progress-bar">
            <div className="step-dot active">1</div>
            <div className="step-line"></div>
            <div className="step-dot">2</div>
          </div>

          <h2>Profilni to'ldirish (1/2)</h2>
          <p className="subtitle">
            {formData.firstName ? `Salom, ${formData.firstName}! ` : "Xush kelibsiz! "}
            Tanishuvlar uchun shaxsiy ma'lumotlaringizni kiriting.
          </p>

          <div className="user-profile-pic">
            <label htmlFor="avatar-input" className="avatar-label">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="avatar-preview"
                />
              ) : (
                <div className="avatar-placeholder">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    alt="avatar"
                  />
                  <div className="avatar-camera-badge">
                    <FaCamera />
                  </div>
                </div>
              )}
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
          <span className="avatar-hint">Rasm yuklash uchun ustiga bosing</span>

          <div className="form-group">
            <label>Ismingiz *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Masalan: Azizbek"
              required
            />
          </div>

          <div className="form-group">
            <label>Tug'ilgan sana *</label>
            <input
              type="date"
              name="birthDate"
              min="1950-01-01"
              max="2008-12-31"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Viloyatingiz *</label>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Viloyatni tanlang
              </option>
              {viloyatlar.map((v, index) => (
                <option key={index} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Keyingisi (Qiziqishlar & Jins)
          </button>
        </form>
      )}

      {/* 2-BOSQICH: Jins, Bio va Qiziqishlar */}
      {complateType === "step2" && (
        <form className="complete-profile-card fade-in-content" onSubmit={handleSubmit}>
          <div className="step-progress-bar">
            <div className="step-dot completed">✓</div>
            <div className="step-line filled"></div>
            <div className="step-dot active">2</div>
          </div>

          <h2>Profilni to'ldirish (2/2)</h2>
          <p className="subtitle">Mos tavsiyalar olish uchun qiziqishlaringizni belgilang.</p>

          <div className="form-group">
            <label>Jinsingiz *</label>
            <div className="gender-container">
              <button
                type="button"
                className={`gender-btn ${formData.gender === "male" ? "active" : ""}`}
                onClick={() => handleGenderSelect("male")}
              >
                Erkak
              </button>
              <button
                type="button"
                className={`gender-btn ${formData.gender === "female" ? "active" : ""}`}
                onClick={() => handleGenderSelect("female")}
              >
                Ayol
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>O'zingiz haqingizda qisqacha (Bio)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Xarakteringiz, sevimli mashg'ulotingiz yoki nimani qidirayotganingiz haqida yozing..."
              rows={3}
              className="bio-textarea"
            />
          </div>

          <div className="form-group">
            <div className="interests-wrapper">
              <label>Qiziqishlaringizni tanlang * ({selectedInterests.length} ta tanlandi)</label>
              <div className="interests-grid">
                {interestsList.map((item) => {
                  const isSelected = selectedInterests.includes(item.name);
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
          </div>

          <div className="action-buttons-row">
            <button
              type="button"
              className="back-step-btn"
              onClick={() => setComplateType("step1")}
            >
              <IoArrowBackOutline />
            </button>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? "Saqlanmoqda..." : "Saqlash va Boshlash 🚀"}
            </button>
          </div>
        </form>
      )}

      {/* TUGATILGAN SOHASIDAGI KARTASI */}
      {complateType === "completed" && (
        <div className="complete-profile-card success-card fade-in-content">
          <div className="celebration-icon">
            <IoSparkles />
          </div>
          <h2>🎉 Tabriklaymiz!</h2>
          <p>Profilingiz muvaffaqiyatli yaratildi. Asosiy lentaga yo'naltirilmoqdasiz...</p>
        </div>
      )}
    </div>
  );
}

export default CompleteProfile;
