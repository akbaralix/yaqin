import React, { useState } from "react";
import {
  FaSearch,
  FaTimes,
  FaSlidersH,
  FaMapMarkerAlt,
  FaVenusMars,
  FaBirthdayCake,
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

const ageRanges = [
  { label: "Barchasi", min: "", max: "" },
  { label: "18 - 22", min: "18", max: "22" },
  { label: "23 - 28", min: "23", max: "28" },
  { label: "29 - 35", min: "29", max: "35" },
  { label: "36+", min: "36", max: "70" },
];

function FilterBar({ filters, onFilterChange, onReset }) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters =
    Boolean(filters.region && filters.region !== "all") ||
    Boolean(filters.gender && filters.gender !== "all") ||
    Boolean(filters.ageMin || filters.ageMax) ||
    Boolean(filters.search && filters.search.trim());

  return (
    <div className="feed-filter-bar">
      {/* Top Search & Toggle Line */}
      <div className="filter-top-row">
        <div className="search-input-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Postlar, shaharlar yoki insonlarni qidirish..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
          {filters.search && (
            <button
              className="clear-search-btn"
              onClick={() => onFilterChange({ search: "" })}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <button
          className={`filter-toggle-btn ${isOpen || hasActiveFilters ? "active" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <FaSlidersH />
          <span>Filtrlar</span>
          {hasActiveFilters && <span className="filter-active-dot" />}
        </button>
      </div>

      {/* Expandable Filter Details Panel */}
      {isOpen && (
        <div className="filter-expanded-panel fade-in-content">
          <div className="filter-group-grid">
            {/* Region Filter */}
            <div className="filter-column">
              <label className="filter-label">
                <FaMapMarkerAlt /> Viloyat / Manzil
              </label>
              <select
                value={filters.region || "all"}
                onChange={(e) => onFilterChange({ region: e.target.value })}
                className="filter-select"
              >
                <option value="all">Barcha viloyatlar</option>
                {viloyatlar.map((v, i) => (
                  <option key={i} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div className="filter-column">
              <label className="filter-label">
                <FaVenusMars /> Jins bo'yicha
              </label>
              <div className="filter-segmented-control">
                <button
                  type="button"
                  className={!filters.gender || filters.gender === "all" ? "active" : ""}
                  onClick={() => onFilterChange({ gender: "all" })}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  className={filters.gender === "female" ? "active" : ""}
                  onClick={() => onFilterChange({ gender: "female" })}
                >
                  Ayollar 👩
                </button>
                <button
                  type="button"
                  className={filters.gender === "male" ? "active" : ""}
                  onClick={() => onFilterChange({ gender: "male" })}
                >
                  Erkaklar 👨
                </button>
              </div>
            </div>

            {/* Age Range Filter */}
            <div className="filter-column">
              <label className="filter-label">
                <FaBirthdayCake /> Yosh oralig'i
              </label>
              <div className="age-buttons-row">
                {ageRanges.map((r, idx) => {
                  const isCurrent =
                    filters.ageMin === r.min && filters.ageMax === r.max;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`age-chip ${isCurrent ? "active" : ""}`}
                      onClick={() =>
                        onFilterChange({ ageMin: r.min, ageMax: r.max })
                      }
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filter Footer */}
          {hasActiveFilters && (
            <div className="filter-panel-footer">
              <button className="reset-filter-btn" onClick={onReset}>
                <FaTimes /> Barcha filtrlarni tozalash
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
