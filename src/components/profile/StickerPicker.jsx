import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

const STICKER_PACKS = [
  {
    name: "Stikerlar",
    icon: "/stickers/sticker1.jpg",
    stickers: Array.from({ length: 12 }, (_, i) => ({
      id: `sticker${i + 1}`,
      src: `/stickers/sticker${i + 1}.jpg`,
    })),
  },
  {
    name: "Toshbaqa",
    icon: "/turtle-stickers/turtle-stickers2.png",
    stickers: [
      { id: "turtle1", src: "/turtle-stickers/turtle-stickers1.gif" },
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `turtle${i + 2}`,
        src: `/turtle-stickers/turtle-stickers${i + 2}.png`,
      })),
    ],
  },
  {
    name: "Utya Duck",
    icon: "/utya-duck-icon/utyaduckicon1.png",
    stickers: Array.from({ length: 12 }, (_, i) => ({
      id: `utya${i + 1}`,
      src: `/utya-duck-icon/utyaduckicon${i + 1}.png`,
    })),
  },
  {
    name: "Emojies",
    icon: "/emojies/emojies1.jpg",
    stickers: Array.from({ length: 14 }, (_, i) => ({
      id: `emoji${i + 1}`,
      src: `/emojies/emojies${i + 1}.jpg`,
    })),
  },
];

function StickerPicker({ isOpen, onClose, onSelect, currentSticker }) {
  const [activePack, setActivePack] = useState(0);

  if (!isOpen) return null;

  const handleSelect = (stickerSrc) => {
    onSelect(stickerSrc);
    onClose();
  };

  const handleRemove = () => {
    onSelect(null);
    onClose();
  };

  return (
    <div className="sticker-picker-overlay" onClick={onClose}>
      <div
        className="sticker-picker-modal scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticker-picker-header">
          <h3>🎨 Stiker tanlang</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Current sticker preview */}
        {currentSticker && (
          <div className="sticker-current-preview">
            <span>Hozirgi: </span>
            <img
              className="sticker-current-img"
              src={currentSticker}
              alt="Hozirgi stiker"
            />
            <button className="sticker-remove-btn" onClick={handleRemove}>
              O'chirish
            </button>
          </div>
        )}

        {/* Pack tabs */}
        <div className="sticker-category-tabs">
          {STICKER_PACKS.map((pack, idx) => (
            <button
              key={idx}
              className={`sticker-cat-btn ${activePack === idx ? "active" : ""}`}
              onClick={() => setActivePack(idx)}
            >
              <img
                src={pack.icon}
                alt={pack.name}
                className="sticker-tab-icon"
              />
              {pack.name}
            </button>
          ))}
        </div>

        {/* Sticker grid */}
        <div className="sticker-grid sticker-grid-images">
          {STICKER_PACKS[activePack].stickers.map((sticker) => (
            <button
              key={sticker.id}
              className={`sticker-item sticker-item-img ${currentSticker === sticker.src ? "selected" : ""}`}
              onClick={() => handleSelect(sticker.src)}
            >
              <img src={sticker.src} alt={sticker.id} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StickerPicker;
