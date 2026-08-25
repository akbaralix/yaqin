import jwt from "jsonwebtoken";
import { supabase } from "../supabase/supabase.js";
import { dbStore } from "../services/dbStore.js";

export const JWT_SECRET =
  process.env.JWT_SECRET || "yaqin_super_secret_jwt_key_2026_modern_dating_network";

/**
 * 1. POST /api/auth/token
 * Telegram OTP or direct code verification to get JWT token
 */
export const getToken = async (req, res) => {
  const { otpCode } = req.body;

  if (!otpCode) {
    return res.status(400).json({ error: "OTP kod yuborilmadi" });
  }

  try {
    const cleanOtp = String(otpCode).trim();

    // a) Supabase'dan verified bo'lgan sessiyani tekshiramiz
    let session = null;
    try {
      const { data: supaSession } = await supabase
        .from("telegram_auth_sessions")
        .select("*")
        .eq("otp_code", cleanOtp)
        .eq("status", "verified")
        .maybeSingle();
      session = supaSession;
    } catch (e) {
      console.warn("Supabase session read warn:", e.message);
    }

    if (!session) {
      return res.status(400).json({
        error: "Sessiya tasdiqlanmagan, eskirgan yoki topilmadi. Botda 'Kirish'ni bosing.",
      });
    }

    const telegramId = session.telegram_id;

    // b) Userni topish yoki yaratish
    let user = await dbStore.findUser(telegramId);

    if (!user) {
      user = await dbStore.upsertUser({
        user_id: telegramId,
        first_name: session.first_name || "Foydalanuvchi",
        username: session.username || null,
        is_profile_complete: false,
      });
    }

    // c) Profil majburiy maydonlari to'ldirilganligini aniqlash
    const isProfileComplete = Boolean(
      user.is_profile_complete === true ||
        user.is_profile_complete === "true" ||
        (user.gender &&
          user.region &&
          (user.birth_date || user.age) &&
          (user.first_name || user.name))
    );

    if (isProfileComplete && !user.is_profile_complete) {
      user = await dbStore.upsertUser({
        ...user,
        is_profile_complete: true,
      });
    }

    // d) JWT Token yaratamiz
    const token = jwt.sign(
      {
        id: user.id,
        user_id: user.user_id,
        first_name: user.first_name,
        is_profile_complete: isProfileComplete,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      token,
      isProfileComplete,
      is_profile_complete: isProfileComplete,
      user: {
        ...user,
        is_profile_complete: isProfileComplete,
      },
    });
  } catch (err) {
    console.error("Token yaratishda xatolik:", err);
    return res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
};

/**
 * 2. POST /api/auth/google
 * Google OAuth sync endpoint
 */
export const googleAuth = async (req, res) => {
  try {
    const { email, name, avatar, googleId } = req.body;

    if (!email && !googleId) {
      return res.status(400).json({ error: "Google ma'lumotlari to'liq emas" });
    }

    // Deterministic numeric / string ID from Google
    let userId = googleId;
    if (!userId && email) {
      // Hash email to positive integer
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        hash = (hash << 5) - hash + email.charCodeAt(i);
        hash |= 0;
      }
      userId = Math.abs(hash);
    }

    let user = await dbStore.findUser(userId);

    if (!user) {
      user = await dbStore.upsertUser({
        user_id: userId,
        first_name: name || "Google Foydalanuvchi",
        profile_pic: avatar || null,
        is_profile_complete: false,
      });
    }

    const isProfileComplete = Boolean(
      user.is_profile_complete === true ||
        user.is_profile_complete === "true" ||
        (user.gender &&
          user.region &&
          (user.birth_date || user.age) &&
          (user.first_name || user.name))
    );

    if (isProfileComplete && !user.is_profile_complete) {
      user = await dbStore.upsertUser({
        ...user,
        is_profile_complete: true,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        user_id: user.user_id,
        first_name: user.first_name,
        is_profile_complete: isProfileComplete,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      token,
      isProfileComplete,
      is_profile_complete: isProfileComplete,
      user: {
        ...user,
        is_profile_complete: isProfileComplete,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ error: "Google tizimiga kirishda xatolik" });
  }
};

/**
 * 2.1 POST /api/auth/telegram-webapp
 * Telegram Mini App (Web App) orqali to'g'ridan-to'g'ri avtorizatsiya
 */
export const telegramWebAppAuth = async (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Telegram ID mavjud emas" });
    }

    const telegramId = Number(id);

    // Userni bazadan topamiz
    let user = await dbStore.findUser(telegramId);

    if (!user) {
      const displayName = [first_name, last_name].filter(Boolean).join(" ") || "Telegram Foydalanuvchi";
      user = await dbStore.upsertUser({
        user_id: telegramId,
        first_name: displayName,
        username: username || null,
        profile_pic: photo_url || null,
        is_profile_complete: false,
      });
    }

    // Profil to'liqligini aniqlaymiz
    const isProfileComplete = Boolean(
      user.is_profile_complete === true ||
        user.is_profile_complete === "true" ||
        (user.gender &&
          user.region &&
          (user.birth_date || user.age) &&
          (user.first_name || user.name))
    );

    if (isProfileComplete && !user.is_profile_complete) {
      user = await dbStore.upsertUser({
        ...user,
        is_profile_complete: true,
      });
    }

    // JWT token yaratamiz
    const token = jwt.sign(
      {
        id: user.id,
        user_id: user.user_id,
        first_name: user.first_name,
        is_profile_complete: isProfileComplete,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return res.json({
      success: true,
      token,
      isProfileComplete,
      is_profile_complete: isProfileComplete,
      user: {
        ...user,
        is_profile_complete: isProfileComplete,
      },
    });
  } catch (err) {
    console.error("Telegram WebApp auth error:", err);
    return res.status(500).json({ error: "Telegram WebApp orqali kirishda xatolik yuz berdi" });
  }
};

/**
 * 3. Express Auth Middleware
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token topilmadi, ruxsat etilmagan" });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res
        .status(403)
        .json({ error: "Token yaroqsiz yoki muddati o'tgan" });
    }

    req.user = decodedUser;
    next();
  });
};

/**
 * 4. Optional Auth Middleware (for feed personalization even if anonymous)
 */
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (!err && decodedUser) {
        req.user = decodedUser;
      }
      next();
    });
  } else {
    next();
  }
};
