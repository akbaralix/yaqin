import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Telegram WebApp BackButton boshqaruvi
 * 1. Agar qandaydir maxsus orqaga qaytish harakati (customAction, masalan chatni yopish) berilsa, uni bajaradi.
 * 2. Agar sahifa bosh sahifa ("/") bo'lmasa, Telegram BackButton ko'rsatiladi va bosilganda react-router orqali orqaga qaytadi.
 * 3. Bosh sahifada BackButton yashiriladi (faqat bot yopilishi mumkin).
 */
export function useTelegramBackButton(customAction = null) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : null;
    if (!tg || !tg.BackButton) return;

    const isHome = location.pathname === "/";
    const hasCustomAction = typeof customAction === "function";

    if (hasCustomAction || !isHome) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }

    const handleClick = () => {
      if (hasCustomAction) {
        customAction();
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/", { replace: true });
      }
    };

    tg.BackButton.onClick(handleClick);

    return () => {
      tg.BackButton.offClick(handleClick);
    };
  }, [location.pathname, customAction, navigate]);
}


