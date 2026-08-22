import React, { useState, useRef } from "react";

const STICKER_PACKS = [
  {
    id: "utya",
    name: "Utya Duck",
    icon: "/utya-duck-icon/utyaduckicon1.png",
    stickers: Array.from({ length: 12 }, (_, i) => ({
      id: `utya-${i + 1}`,
      url: `/utya-duck-icon/utyaduckicon${i + 1}.png`,
    })),
  },
  {
    id: "meme",
    name: "Meme",
    icon: "/allicon/sticker1.jpg",
    stickers: Array.from({ length: 22 }, (_, i) => ({
      id: `meme-${i + 1}`,
      url: `/allicon/sticker${i + 1}.jpg`,
    })),
  },
  {
    id: "turtle",
    name: "Toshbaqa",
    icon: "/turtle-stickers/turtle-stickers2.png",
    stickers: [
      { id: "turtle-1", url: "/turtle-stickers/turtle-stickers1.gif" },
      ...Array.from({ length: 30 }, (_, i) => ({
        id: `turtle-${i + 2}`,
        url: `/turtle-stickers/turtle-stickers${i + 2}.png`,
      })),
    ],
  },
  {
    id: "stickers",
    name: "Stikerlar",
    icon: "/stickers/sticker1.jpg",
    stickers: Array.from({ length: 12 }, (_, i) => ({
      id: `stickers-${i + 1}`,
      url: `/stickers/sticker${i + 1}.jpg`,
    })),
  },
];

function StickerPicker({ onStickerSelect, onClose }) {
  const [activePack, setActivePack] = useState(STICKER_PACKS[0].id);
  const gridRef = useRef(null);

  const currentPack = STICKER_PACKS.find((p) => p.id === activePack);

  // Pack almashganda skrollni avtomattik yuqoriga qaytarish
  const handlePackChange = (packId) => {
    setActivePack(packId);
    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="sticker-picker-container">
      {/* Sticker Grid */}
      <div className="sticker-grid" ref={gridRef}>
        {currentPack?.stickers.map((sticker) => (
          <button
            key={sticker.id}
            className="sticker-item"
            onClick={() => {
              onStickerSelect(sticker.url);
              if (onClose) onClose();
            }}
            title="Stiker yuborish"
          >
            <img
              src={sticker.url}
              alt={sticker.id}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </button>
        ))}
      </div>

      {/* Pack Tabs at bottom like Telegram */}
      <div className="sticker-pack-tabs">
        {STICKER_PACKS.map((pack) => (
          <button
            key={pack.id}
            className={`sticker-pack-tab ${activePack === pack.id ? "active" : ""}`}
            onClick={() => handlePackChange(pack.id)}
            title={pack.name}
          >
            <img
              src={pack.icon}
              alt={pack.name}
              onError={(e) => {
                e.target.src =
                  "https://cdn-icons-png.flaticon.com/512/742/742751.png"; // zaxira ikonka
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default StickerPicker;
