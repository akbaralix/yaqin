import React, { useState } from "react";
import {
  FaTimes,
  FaImages,
  FaMapMarkerAlt,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { api } from "../../services/api";

function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFiles = (files) => {
    const selected = Array.from(files);
    const totalCount = images.length + selected.length;

    if (totalCount > 10) {
      toast.error("Ko'pi bilan 10 ta rasm yuklashingiz mumkin!");
      return;
    }

    const newPreviews = selected.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...selected]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Kamida 1 ta rasm yuklashingiz shart (1-10 ta)!");
      return;
    }

    if (images.length > 10) {
      toast.error("Ko'pi bilan 10 ta rasm yuklash mumkin!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("location", location);

      images.forEach((imgFile) => {
        formData.append("images", imgFile);
      });

      const res = await api.createPost(formData);

      if (res?.success) {
        toast.success("Post muvaffaqiyatli chop etildi! 🎉");
        setImages([]);
        setImagePreviews([]);
        setCaption("");
        setLocation("");
        if (onPostCreated) onPostCreated(res.post);
        onClose();
      } else {
        toast.error(res?.error || "Post yaratishda xatolik");
      }
    } catch (err) {
      console.error("Create post error:", err);
      toast.error(err.message || "Serverga ulanishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="create-post-modal scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Yangi Post Yaratish</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          {/* Multi-Image Upload Area (1 to 10 images) */}
          <div className="post-upload-section">
            <label className="upload-section-title">
              Rasmlar ({imagePreviews.length}/10){" "}
              <span className="req-tag">* Kamida 1 ta</span>
            </label>

            {imagePreviews.length === 0 ? (
              <label htmlFor="post-images-input" className="post-dropzone">
                <FaImages className="dropzone-icon" />
                <span className="dropzone-text">
                  Rasmlarni tanlang yoki bu yerga sudrab tashlang
                </span>
                <span className="dropzone-hint">
                  1 tadan 10 tagacha rasm yuklash mumkin (Carousel ko'rinishida)
                </span>
              </label>
            ) : (
              <div className="previews-grid">
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="preview-item">
                    <img src={src} alt={`Upload ${idx + 1}`} />
                    <span className="preview-badge">{idx + 1}</span>
                    <button
                      type="button"
                      className="preview-remove-btn"
                      onClick={() => removeImage(idx)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

                {imagePreviews.length < 10 && (
                  <label
                    htmlFor="post-images-input"
                    className="preview-add-more"
                  >
                    <FaPlus />
                    <span>Qo'shish</span>
                  </label>
                )}
              </div>
            )}

            <input
              id="post-images-input"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInputChange}
              style={{ display: "none" }}
            />
          </div>

          {/* Caption Textarea (Optional) */}
          <div className="form-group">
            <label>Matn / Izoh (Ixtiyoriy)</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Fikr va his-tuyg'ularingizni yozing..."
              rows={3}
              className="post-caption-input"
            />
          </div>

          {/* Location Input (Optional) */}
          <div className="form-group">
            <label>Joylashuv (Ixtiyoriy)</label>
            <div className="location-input-wrapper">
              <FaMapMarkerAlt className="location-icon" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Masalan: Toshkent, Magic City"
              />
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

            <button
              type="submit"
              className="submit-post-btn"
              disabled={loading || images.length === 0}
            >
              {loading ? "Yuklanmoqda..." : "Ulashish (Publish) 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;
