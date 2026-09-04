import express from "express";
import multer from "multer";
import cors from "cors";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { supabase } from "./supabase/supabase.js";
import { startBot } from "./bot/bot.js";
import {
  getToken,
  googleAuth,
  telegramWebAppAuth,
  authenticateToken,
  optionalAuth,
  JWT_SECRET,
} from "./middleware/auth.js";
import { dbStore } from "./services/dbStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../dist");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Multer in-memory storage for handling avatar and post images (up to 10 images)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
  },
});

// Middleware wrappers that only invoke multer when Content-Type is multipart/form-data
const handleMultipartSingle = (fieldName) => (req, res, next) => {
  const ct = req.headers["content-type"] || "";
  if (ct.includes("multipart/form-data")) {
    return upload.single(fieldName)(req, res, next);
  }
  next();
};

const handleMultipartArray =
  (fieldName, maxCount = 10) =>
  (req, res, next) => {
    const ct = req.headers["content-type"] || "";
    if (ct.includes("multipart/form-data")) {
      return upload.array(fieldName, maxCount)(req, res, next);
    }
    next();
  };

// Helper to upload file buffer to Supabase Storage "rasmlar" bucket
async function uploadToSupabase(file, folder = "uploads") {
  if (!file) return null;
  const fileExt = (file.originalname || "jpg").split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("rasmlar")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype || "image/jpeg",
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabase.storage
        .from("rasmlar")
        .getPublicUrl(fileName);
      return publicUrlData.publicUrl;
    } else {
      console.warn("Supabase upload warning:", uploadError.message);
    }
  } catch (err) {
    console.warn("Storage upload exception:", err.message);
  }

  // Fallback: Convert buffer to data URI so images never break
  const base64 = file.buffer.toString("base64");
  return `data:${file.mimetype || "image/jpeg"};base64,${base64}`;
}

// --- 1. HEALTH CHECK ---
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Yaqin Dating & Social Network API muvaffaqiyatli ishlayapti! 🚀",
    version: "2.0.0",
  });
});

app.get("/", (req, res, next) => {
  const isHtml = req.headers.accept && req.headers.accept.includes("text/html");
  if (!isHtml || !fs.existsSync(distPath)) {
    return res.json({
      status: "ok",
      message:
        "Yaqin Dating & Social Network API muvaffaqiyatli ishlayapti! 🚀",
      version: "2.0.0",
    });
  }
  next();
});

// --- 2. AUTHENTICATION ENDPOINTS ---
app.post("/api/auth/token", getToken);
app.post("/api/auth/google", googleAuth);
app.post("/api/auth/telegram-webapp", telegramWebAppAuth);

// --- 3. ONBOARDING / COMPLETE PROFILE ---
app.get("/api/user/check-username", optionalAuth, async (req, res) => {
  try {
    const { username } = req.query;
    const currentUserId = req.user?.user_id;
    if (!username) {
      return res.status(400).json({ available: false, error: "Username kiritilmadi" });
    }

    const available = await dbStore.checkUsernameAvailable(username, currentUserId);
    return res.json({ success: true, available });
  } catch (err) {
    console.error("Check username error:", err);
    return res.status(500).json({ available: false, error: "Server xatosi" });
  }
});

app.post(
  "/api/user/complete-profile",
  authenticateToken,
  handleMultipartSingle("avatar"),
  async (req, res) => {
    try {
      const userId = req.user.user_id;
      const {
        firstName,
        username,
        birthDate,
        region,
        gender,
        interests,
        bio,
        profileSticker,
      } = req.body;

      if (!firstName || !region || !gender || !username) {
        return res
          .status(400)
          .json({ error: "Barcha majburiy maydonlarni (ism, username, viloyat, jins) to'ldiring!" });
      }

      // Username validation (3-30 chars, alphanumeric + underscores + dots)
      const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
      if (!/^[a-zA-Z0-9_.]{3,30}$/.test(cleanUsername)) {
        return res
          .status(400)
          .json({ error: "Username 3 tadan 30 tagacha harf, raqam yoki (_) iborat bo'lishi kerak" });
      }

      const isAvailable = await dbStore.checkUsernameAvailable(cleanUsername, userId);
      if (!isAvailable) {
        return res
          .status(400)
          .json({ error: "Bu username allaqachon band! Boshqa username tanlang." });
      }

      let profilePicUrl = null;
      if (req.file) {
        profilePicUrl = await uploadToSupabase(req.file, "avatars");
      }

      let parsedInterests = [];
      if (interests) {
        try {
          parsedInterests =
            typeof interests === "string" ? JSON.parse(interests) : interests;
        } catch (e) {
          parsedInterests = Array.isArray(interests) ? interests : [interests];
        }
      }

      const calculatedAge = dbStore.calculateAge(birthDate);

      const updatePayload = {
        user_id: userId,
        first_name: firstName.trim(),
        username: cleanUsername,
        birth_date: birthDate || null,
        age: calculatedAge || 20,
        region: region.trim(),
        gender: gender,
        interests: parsedInterests,
        bio: bio ? bio.trim() : "",
        is_profile_complete: true,
        profile_sticker: profileSticker || null,
      };

      if (profilePicUrl) {
        updatePayload.profile_pic = profilePicUrl;
      }

      // Save user to DB store & Supabase
      const updatedUser = await dbStore.upsertUser(updatePayload);

      // Generate NEW JWT token with is_profile_complete = true (Requirement 1)
      const newToken = jwt.sign(
        {
          id: updatedUser.id,
          user_id: updatedUser.user_id,
          first_name: updatedUser.first_name,
          username: updatedUser.username,
          is_profile_complete: true,
        },
        JWT_SECRET,
        { expiresIn: "30d" },
      );

      return res.json({
        success: true,
        message: "Profil muvaffaqiyatli saqlandi!",
        token: newToken,
        is_profile_complete: true,
        user: updatedUser,
      });
    } catch (err) {
      console.error("Complete profile error:", err);
      return res
        .status(500)
        .json({ error: "Profilni saqlashda kutilmagan xatolik yuz berdi" });
    }
  },
);

// --- 4. CURRENT USER INFO & PROFILE MANAGEMENT ---
app.get("/api/user/me", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = await dbStore.findUser(userId);

    if (!user) {
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    }

    const isComplete = Boolean(
      user.is_profile_complete === true ||
      user.is_profile_complete === "true" ||
      (user.gender &&
        user.region &&
        user.username &&
        (user.birth_date || user.age) &&
        (user.first_name || user.name)),
    );

    const analytics = await dbStore.getUserAnalytics(userId);

    return res.json({
      success: true,
      user: {
        ...user,
        is_profile_complete: isComplete,
        stats: {
          viewsCount: analytics?.viewsCount || 0,
          totalLikesReceived: analytics?.totalLikesReceived || 0,
          totalPosts: analytics?.totalPosts || 0,
          totalMatches: analytics?.totalMatches || 0,
          followersCount: analytics?.followersCount || 0,
          followingCount: analytics?.followingCount || 0,
        },
      },
    });
  } catch (err) {
    console.error("Get /me error:", err);
    return res
      .status(500)
      .json({ error: "Foydalanuvchi ma'lumotlarini olishda xatolik" });
  }
});

// Edit user profile
app.put(
  "/api/user/profile",
  authenticateToken,
  handleMultipartSingle("avatar"),
  async (req, res) => {
    try {
      const userId = req.user.user_id;
      const {
        firstName,
        username,
        bio,
        birthDate,
        region,
        gender,
        interests,
        profileSticker,
      } = req.body;

      let profilePicUrl = null;
      if (req.file) {
        profilePicUrl = await uploadToSupabase(req.file, "avatars");
      }

      let parsedInterests = undefined;
      if (interests) {
        try {
          parsedInterests =
            typeof interests === "string" ? JSON.parse(interests) : interests;
        } catch (e) {
          parsedInterests = Array.isArray(interests) ? interests : [interests];
        }
      }

      const updatePayload = {
        user_id: userId,
      };

      if (firstName) updatePayload.first_name = firstName.trim();
      if (username) {
        const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
        if (!/^[a-zA-Z0-9_.]{3,30}$/.test(cleanUsername)) {
          return res
            .status(400)
            .json({ error: "Username 3 tadan 30 tagacha harf, raqam yoki (_) iborat bo'lishi kerak" });
        }
        const isAvailable = await dbStore.checkUsernameAvailable(cleanUsername, userId);
        if (!isAvailable) {
          return res.status(400).json({ error: "Bu username allaqachon band!" });
        }
        updatePayload.username = cleanUsername;
      }
      if (bio !== undefined) updatePayload.bio = bio.trim();
      if (region) updatePayload.region = region.trim();
      if (gender) updatePayload.gender = gender;
      if (parsedInterests) updatePayload.interests = parsedInterests;
      if (birthDate) {
        updatePayload.birth_date = birthDate;
        updatePayload.age = dbStore.calculateAge(birthDate);
      }
      if (profilePicUrl) {
        updatePayload.profile_pic = profilePicUrl;
      }
      if (profileSticker !== undefined) {
        updatePayload.profile_sticker = profileSticker || null;
      }

      const updatedUser = await dbStore.upsertUser(updatePayload);

      return res.json({
        success: true,
        message: "Profil muvaffaqiyatli yangilandi!",
        user: updatedUser,
      });
    } catch (err) {
      console.error("Edit profile error:", err);
      return res.status(500).json({ error: "Profilni yangilashda xatolik" });
    }
  },
);

// Toggle Follow / Obuna bo'lish endpoint
app.post("/api/user/:userId/follow", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.user_id;
    let targetIdentifier = req.params.userId;

    let targetUser = null;
    if (/^\d+$/.test(targetIdentifier)) {
      targetUser = await dbStore.findUser(targetIdentifier);
    }
    if (!targetUser) {
      targetUser = await dbStore.findUserByUsername(targetIdentifier);
    }

    if (!targetUser) {
      return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    }

    const result = await dbStore.toggleFollowUser(currentUserId, targetUser.user_id);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Follow error:", err);
    return res.status(500).json({ error: err.message || "Obunani yangilashda xatolik" });
  }
});

// User Profile Analytics
app.get("/api/user/analytics/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const analytics = await dbStore.getUserAnalytics(userId);
    return res.json({
      success: true,
      analytics,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return res
      .status(500)
      .json({ error: "Analitika ma'lumotlarini olishda xatolik" });
  }
});

// View public profile of another user (supports ID or username, e.g. /api/user/akbarali or /api/user/123456)
app.get("/api/user/:identifier", optionalAuth, async (req, res) => {
  try {
    const identifier = req.params.identifier;
    const viewerId = req.user?.user_id;

    let user = null;
    // Agar raqam bo'lsa avval user_id bo'yicha qidiramiz
    if (/^\d+$/.test(identifier)) {
      user = await dbStore.findUser(identifier);
    }
    // Agar topilmasa yoki matn (username) bo'lsa username bo'yicha qidiramiz
    if (!user) {
      user = await dbStore.findUserByUsername(identifier);
    }

    if (!user) {
      return res.status(404).json({ error: "Foydalanuvchi profili topilmadi" });
    }

    if (viewerId && String(viewerId) !== String(user.user_id)) {
      await dbStore.recordProfileView(viewerId, user.user_id);
    }

    const posts = await dbStore.getPosts({ authorUserId: user.user_id });
    const analytics = await dbStore.getUserAnalytics(user.user_id);
    let isFollowing = false;
    if (viewerId) {
      isFollowing = await dbStore.isFollowing(viewerId, user.user_id);
    }

    return res.json({
      success: true,
      user: {
        ...user,
        stats: {
          viewsCount: analytics?.viewsCount || 0,
          totalLikesReceived: analytics?.totalLikesReceived || 0,
          totalPosts: posts.length,
          totalMatches: analytics?.totalMatches || 0,
          followersCount: analytics?.followersCount || 0,
          followingCount: analytics?.followingCount || 0,
        },
      },
      posts,
      isFollowing,
    });
  } catch (err) {
    console.error("Get user profile error:", err);
    return res.status(500).json({ error: "Profilni yuklashda xatolik" });
  }
});

// --- 5. POSTS & FEED (Requirements 2 & 3) ---

// Feed with filters and Smart Recommendation
app.get("/api/posts", optionalAuth, async (req, res) => {
  try {
    const { region, gender, ageMin, ageMax, interest, search, userId } =
      req.query;
    const currentUserId = req.user?.user_id;

    const posts = await dbStore.getPosts({
      currentUserId,
      region,
      gender,
      ageMin,
      ageMax,
      interest,
      search,
      authorUserId: userId,
    });

    return res.json({
      success: true,
      posts,
      count: posts.length,
    });
  } catch (err) {
    console.error("Get posts feed error:", err);
    return res.status(500).json({ error: "Postlarni yuklashda xatolik" });
  }
});

// Create Post (1 to 10 images carousel) (Requirement 3: Post Yaratish)
app.post(
  "/api/posts",
  authenticateToken,
  handleMultipartArray("images", 10), // User can upload 1 to 10 images
  async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { caption, location, existingImages } = req.body;

      let uploadedImageUrls = [];

      // 1. Upload newly selected files
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const url = await uploadToSupabase(file, "posts");
          if (url) uploadedImageUrls.push(url);
        }
      }

      // 2. Include any existing / provided image URLs
      if (existingImages) {
        try {
          const parsed =
            typeof existingImages === "string"
              ? JSON.parse(existingImages)
              : existingImages;
          if (Array.isArray(parsed)) {
            uploadedImageUrls = [...uploadedImageUrls, ...parsed];
          }
        } catch (e) {}
      }

      if (uploadedImageUrls.length === 0) {
        return res
          .status(400)
          .json({ error: "Kamida 1 ta rasm yuklashingiz shart (1-10 ta)!" });
      }

      if (uploadedImageUrls.length > 10) {
        return res
          .status(400)
          .json({ error: "Ko'pi bilan 10 ta rasm yuklash mumkin!" });
      }

      const newPost = await dbStore.createPost({
        user_id: userId,
        caption: caption ? caption.trim() : "",
        location: location ? location.trim() : "",
        images: uploadedImageUrls,
      });

      return res.status(201).json({
        success: true,
        message: "Post muvaffaqiyatli chop etildi!",
        post: newPost,
      });
    } catch (err) {
      console.error("Create post error:", err);
      return res
        .status(500)
        .json({ error: "Post yaratishda xatolik yuz berdi" });
    }
  },
);

// Toggle Like on Post (Requirement 3: Interaktivlik - Like toggle)
app.post("/api/posts/:postId/like", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id;

    const result = await dbStore.toggleLikePost(postId, userId);

    return res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Post like toggle error:", err);
    return res
      .status(500)
      .json({ error: "Like holatini o'zgartirib bo'lmadi" });
  }
});

// Get Comments on Post
app.get("/api/posts/:postId/comments", optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await dbStore.getComments(postId);

    return res.json({
      success: true,
      comments,
    });
  } catch (err) {
    console.error("Get comments error:", err);
    return res.status(500).json({ error: "Izohlarni yuklashda xatolik" });
  }
});

// Add Comment on Post (Requirement 3: Interaktivlik - Izohlar)
app.post("/api/posts/:postId/comments", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.user_id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Izoh matnini kiriting" });
    }

    const comment = await dbStore.addComment(postId, userId, text);

    return res.status(201).json({
      success: true,
      comment,
    });
  } catch (err) {
    console.error("Add comment error:", err);
    return res.status(500).json({ error: "Izoh qo'shishda xatolik yuz berdi" });
  }
});

// --- 6. TANISHUV / DATING SWIPE (Requirement 4) ---

// Get candidate profiles auto-filtered by opposite gender
app.get("/api/dating/cards", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { region, ageMin, ageMax, gender } = req.query;

    const candidates = await dbStore.getDatingCandidates(userId, {
      region,
      ageMin,
      ageMax,
      gender,
    });
    return res.json({
      success: true,
      candidates,
      count: candidates.length,
    });
  } catch (err) {
    console.error("Get dating cards error:", err);
    return res
      .status(500)
      .json({ error: "Tanishuv profillarini yuklashda xatolik" });
  }
});

// Swipe action (Like / Skip / Superlike) + Instant Match detection
app.post("/api/dating/swipe", authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.user_id;
    const { targetId, action } = req.body;

    if (!targetId || !action) {
      return res.status(400).json({ error: "targetId va action yuborilmadi" });
    }

    const result = await dbStore.handleSwipe(senderId, targetId, action);

    return res.json(result);
  } catch (err) {
    console.error("Dating swipe error:", err);
    return res.status(500).json({ error: "Swipe amalini bajarishda xatolik" });
  }
});

// Get all matches for current user
app.get("/api/dating/matches", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const matches = await dbStore.getMatches(userId);

    return res.json({
      success: true,
      matches,
    });
  } catch (err) {
    console.error("Get matches error:", err);
    return res.status(500).json({ error: "Matchlarni yuklashda xatolik" });
  }
});

// DELETE /api/dating/matches/:matchId
app.delete(
  "/api/dating/matches/:matchId",
  authenticateToken,
  async (req, res) => {
    try {
      const { matchId } = req.params;
      const currentUserId = Number(req.user.user_id);

      // 1. Match yozuvini ID bo'yicha topamiz
      const { data: matchRow, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (matchError) {
        console.warn("Find match error:", matchError.message);
      }

      if (!matchRow) {
        return res.status(404).json({ error: "Match topilmadi" });
      }

      // 2. Sherik ID sini aniqlaymiz
      const partnerId =
        Number(matchRow.user1_id) === currentUserId
          ? Number(matchRow.user2_id)
          : Number(matchRow.user1_id);

      // 3. Bazaning BARCHA jadvallaridan ikkala tomon uchun tozalaymiz
      await Promise.allSettled([
        // matches jadvalidan o'chirish
        supabase.from("matches").delete().eq("id", matchId),

        // dating_swipes — ikkala tomondan o'chirish (qayta match bo'lmasligi uchun)
        supabase
          .from("dating_swipes")
          .delete()
          .or(
            `and(sender_id.eq.${currentUserId},target_id.eq.${partnerId}),and(sender_id.eq.${partnerId},target_id.eq.${currentUserId})`,
          ),

        // messages — ikkala tomonning xabarlari o'chiriladi
        supabase
          .from("messages")
          .delete()
          .or(
            `and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`,
          ),
      ]);

      return res.json({
        success: true,
        message: "Match va barcha bog'liq ma'lumotlar ikki tomon uchun o'chirildi",
      });
    } catch (err) {
      console.error("Delete match error:", err);
      return res
        .status(500)
        .json({ error: "Matchni o'chirishda xatolik yuz berdi" });
    }
  },
);

// --- 7. REALTIME CHAT MESSAGES ---
app.get("/api/messages/:partnerId", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.user_id;
    const partnerId = req.params.partnerId;

    const messages = await dbStore.getChatMessages(currentUserId, partnerId);
    await dbStore.markMessagesAsRead(partnerId, currentUserId);

    return res.json({
      success: true,
      messages,
    });
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({ error: "Xabarlarni yuklashda xatolik" });
  }
});

app.post("/api/messages/:partnerId", authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.user_id;
    const partnerId = req.params.partnerId;
    const { text, reply_to, sticker } = req.body;

    let payload = text;
    if (reply_to || sticker || typeof text === "object") {
      payload = {
        text: text || "",
        reply_to: reply_to || null,
        sticker: sticker || null,
      };
    }

    if (!payload || (typeof payload === "string" && !payload.trim()) || (typeof payload === "object" && !payload.text && !payload.sticker)) {
      return res
        .status(400)
        .json({ error: "Xabar matni yoki stiker bo'sh bo'lishi mumkin emas" });
    }

    const message = await dbStore.sendMessage(currentUserId, partnerId, payload);

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (err) {
    console.error("Send message error:", err);
    return res.status(500).json({ error: "Xabar yuborishda xatolik" });
  }
});

// Serve static frontend assets and SPA routes if dist folder exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Express unhandled error:", err);
  res.status(500).json({ error: "Server ichki xatoligi" });
});

// Start Telegram bot & Express Server
startBot();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Yaqin Server http://localhost:${PORT} manzilida ishlayapti`);
});
