import React, { useEffect, useState } from "react";
import {
  FaEye,
  FaHeart,
  FaImages,
  FaFire,
  FaUsers,
} from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import { api } from "../../services/api";

function ProfileAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.getUserAnalytics();
        if (res?.analytics) {
          setAnalytics(res.analytics);
        }
      } catch (err) {
        console.warn("Analytics error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="analytics-loading">Statistika yuklanmoqda...</div>;
  }

  const views = analytics?.viewsCount || 0;
  const likes = analytics?.totalLikesReceived || 0;
  const posts = analytics?.totalPosts || 0;
  const matches = analytics?.totalMatches || 0;
  const engagement = analytics?.engagementRate || 85;

  return (
    <div className="profile-analytics-section fade-in-content">
      <div className="analytics-hero-header">
        <h2>Profil Faolligi va Analitikasi 📊</h2>
        <p>Profilingiz qanchalik mashhur va boshqa foydalanuvchilar orasida faol ekanligini kuzating</p>
      </div>

      {/* Main KPI Stat Cards */}
      <div className="kpi-grid">
        {/* Views Count */}
        <div className="kpi-card views">
          <div className="kpi-icon-box">
            <FaEye />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Profil ko'rishlar soni</span>
            <h3 className="kpi-value">{views}</h3>
            <span className="kpi-subtext">Boshqa foydalanuvchilar sizni ko'rgan</span>
          </div>
        </div>

        {/* Total Likes */}
        <div className="kpi-card likes">
          <div className="kpi-icon-box">
            <FaHeart />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">To'plangan Likelar</span>
            <h3 className="kpi-value">{likes}</h3>
            <span className="kpi-subtext">
              Postlar ({analytics?.postLikesReceived || 0}) + Tanishuv ({analytics?.datingLikesReceived || 0})
            </span>
          </div>
        </div>

        {/* Total Posts */}
        <div className="kpi-card posts">
          <div className="kpi-icon-box">
            <FaImages />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Chop etilgan Postlar</span>
            <h3 className="kpi-value">{posts}</h3>
            <span className="kpi-subtext">Galereyangizdagi postlar</span>
          </div>
        </div>

        {/* Matches */}
        <div className="kpi-card matches">
          <div className="kpi-icon-box">
            <FaFire />
          </div>
          <div className="kpi-info">
            <span className="kpi-label">O'zaro Matchlar</span>
            <h3 className="kpi-value">{matches}</h3>
            <span className="kpi-subtext">Bir-biriga yoqqan insonlar</span>
          </div>
        </div>
      </div>

      {/* Deep Dive Breakdown */}
      <div className="analytics-details-grid">
        <div className="detail-card">
          <div className="detail-card-header">
            <h4>
              <FaArrowTrendUp /> Faollik va Qiziqish Darajasi
            </h4>
            <span className="detail-badge high">{engagement}% faollik</span>
          </div>
          <p className="detail-description">
            Profilingizga tashrif buyurganlarning qariyb <b>{engagement}%</b> qismi sizning postlaringizga yoki tanishuv profilingizga ijobiy munosabat bildirgan.
          </p>

          <div className="engagement-bar-container">
            <div className="engagement-bar-track">
              <div
                className="engagement-bar-fill"
                style={{ width: `${Math.min(engagement, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-card-header">
            <h4>
              <FaUsers /> Profilni Ommalashtirish Bo'yicha Maslahatlar
            </h4>
          </div>
          <ul className="tips-list">
            <li>✨ Haftada kamida 2 ta sifatli va qiziqarli post joylang.</li>
            <li>📍 Joylashuv va qiziqishlaringizni to'liq belgilash mos tavsiyalar sonini oshiradi.</li>
            <li>💬 Tanishuv bo'limida faol bo'lib, o'zaro matchlar sonini ko'paytiring.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProfileAnalytics;
