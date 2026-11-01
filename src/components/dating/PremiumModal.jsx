import React from "react";
import { FaCrown, FaStar, FaBolt, FaCheck, FaTimes, FaTelegramPlane } from "react-icons/fa";

function PremiumModal({ isOpen, onClose, remaining = 0 }) {
  if (!isOpen) return null;

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div
        className="premium-modal-card scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="premium-modal-close" onClick={onClose} title="Yopish">
          <FaTimes />
        </button>

        <div className="premium-crown-badge">
          <FaCrown className="crown-icon" />
        </div>

        <h2 className="premium-title">Yaqin Premium</h2>
        <p className="premium-subtitle">
          Kunlik Superlike limitingiz tugadi (3/3). Premium versiyani faollashtiring va barcha imkoniyatlardan cheklovsiz foydalaning!
        </p>

        <div className="premium-features-list">
          <div className="premium-feature-item">
            <div className="feature-icon star">
              <FaStar />
            </div>
            <div className="feature-info">
              <h4>Cheksiz Superlikelar</h4>
              <p>O'zingizga yoqqan insonlarga cheklovlarsiz Superlike yuboring</p>
            </div>
          </div>

          <div className="premium-feature-item">
            <div className="feature-icon bolt">
              <FaBolt />
            </div>
            <div className="feature-info">
              <h4>Top o'rinda ko'rinish</h4>
              <p>Profilingiz boshqa foydalanuvchilar orasida birinchilardan bo'lib chiqadi</p>
            </div>
          </div>

          <div className="premium-feature-item">
            <div className="feature-icon check">
              <FaCheck />
            </div>
            <div className="feature-info">
              <h4>Profilni kim ko'rganini bilish</h4>
              <p>Sizni ko'rgan va yoqtirgan barcha odamlarni oldindan bilib oling</p>
            </div>
          </div>
        </div>

        <div className="premium-pricing-box">
          <div className="premium-price">
            <span className="price-amount">⭐ 100 Stars</span>
            <span className="price-currency"> / 1 oy</span>
          </div>
          <div className="premium-price-discount" style={{ marginTop: '6px', fontSize: '13px', color: '#7c3aed', fontWeight: 'bold' }}>
            🎉 3 oylik tarif: ⭐ 280 Stars (Chegirma bilan)
          </div>
          <p className="price-hint">Telegram Stars orqali 1 soniyada xarid qiling</p>
        </div>

        <div className="premium-action-buttons">
          <a
            href="https://t.me/YaqinTanishuvlarbot?start=premium"
            target="_blank"
            rel="noopener noreferrer"
            className="premium-buy-btn"
          >
            <FaTelegramPlane /> Telegram Stars bilan sotib olish
          </a>
          <button className="premium-cancel-btn" onClick={onClose}>
            Keyinroq
          </button>
        </div>
      </div>
    </div>
  );
}

export default PremiumModal;
