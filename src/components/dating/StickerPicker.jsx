import React, { useState } from "react";

// Sticker packs from /public folder
const STICKER_PACKS = [
  {
    id: "stickers",
    name: "Stikerlar",
    icon: "/stickers/sticker1.jpg",
    stickers: Array.from({ length: 12 }, (_, i) => ({
      id: `sticker-${i + 1}`,
      url: `/stickers/sticker${i + 1}.jpg`,
    })),
  },
  {
    id: "turtle",
    name: "Toshbaqa",
    icon: "/turtle-stickers/turtle-stickers2.png",
    stickers: [
      { id: "turtle-1", url: "/turtle-stickers/turtle-stickers1.gif" },
      ...Array.from({ length: 9 }, (_, i) => ({
        id: `turtle-${i + 2}`,
        url: `/turtle-stickers/turtle-stickers${i + 2}.png`,
      })),
    ],
  },
  {
    id: "utya",
    name: "Utya Duck",
    icon: "/utya-duck-icon/utyaduckicon1.png",
    stickers: Array.from({ length: 12 }, (_, i) => ({
      id: `utya-${i + 1}`,
      url: `/utya-duck-icon/utyaduckicon${i + 1}.png`,
    })),
  },
];

function StickerPicker({ onStickerSelect, onClose }) {
  const [activePack, setActivePack] = useState(STICKER_PACKS[0].id);

  const currentPack = STICKER_PACKS.find((p) => p.id === activePack);

  return (
    <div className="sticker-picker-container">
      {/* Sticker Grid */}
      <div className="sticker-grid">
        {currentPack?.stickers.map((sticker) => (
          <button
            key={sticker.id}
            className="sticker-item"
            onClick={() => {
              onStickerSelect(sticker.url);
              onClose();
            }}
            title="Stiker yuborish"
          >
            <img src={sticker.url} alt={sticker.id} loading="lazy" />
          </button>
        ))}
      </div>

      {/* Pack Tabs at bottom like Telegram */}
      <div className="sticker-pack-tabs">
        {STICKER_PACKS.map((pack) => (
          <button
            key={pack.id}
            className={`sticker-pack-tab ${activePack === pack.id ? "active" : ""}`}
            onClick={() => setActivePack(pack.id)}
            title={pack.name}
          >
            <img src={pack.icon} alt={pack.name} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default StickerPicker;
