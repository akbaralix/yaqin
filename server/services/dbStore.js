import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../supabase/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");
const STORE_PATH = path.join(DATA_DIR, "db_store.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data with realistic Uzbek users, posts with carousels, dating candidates
const SEED_DATA = {
  users: [
    {
      id: "u1-aziza",
      user_id: 101,
      username: "aziza_karimova",
      first_name: "Aziza",
      bio: "UI/UX dizayner & qahva ishqibozi ☕ San'at, sayohat va kitoblar olamida yashayman ✨",
      profile_pic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
      gender: "female",
      birth_date: "2001-05-14",
      age: 23,
      region: "Toshkent shahri",
      interests: ["Sayohat", "Rasm chizish / San'at", "Kitobxonlik", "Kino & Seriallar"],
      phone_number: "+998901234567",
      is_profile_complete: true,
      views_count: 142,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "u2-sarvar",
      user_id: 102,
      username: "sarvar_bek",
      first_name: "Sarvar",
      bio: "Full-stack developer 💻 Futbol va faol sport muxlisi ⚽ Yangi g'oyalar va startup lar ustida ishlayman.",
      profile_pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
      gender: "male",
      birth_date: "1999-08-20",
      age: 25,
      region: "Samarqand",
      interests: ["Dasturlash", "Futbol", "Sport & Fitnes", "Sayohat"],
      phone_number: "+998935557788",
      is_profile_complete: true,
      views_count: 88,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "u3-madina",
      user_id: 103,
      username: "madina_aliyeva",
      first_name: "Madina",
      bio: "Arxitektor & fotograf 📸 Tabiat go'zalliklarini kashf etishni yoqtiraman. Tog'lar bag'rida dam olish eng yaxshi hordiq 🏔️",
      profile_pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      gender: "female",
      birth_date: "2000-02-11",
      age: 24,
      region: "Toshkent viloyati",
      interests: ["Suratga olish", "Sayohat", "Musiqa", "Rasm chizish / San'at"],
      phone_number: "+998971112233",
      is_profile_complete: true,
      views_count: 215,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "u4-shahzod",
      user_id: 104,
      username: "shahzod_fitness",
      first_name: "Shahzod",
      bio: "Fitnes murabbiy 🏋️‍♂️ Sog'lom turmush tarzi va to'g'ri ovqatlanish tarafdoriman. Motivatsiya va intizom!",
      profile_pic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
      gender: "male",
      birth_date: "1998-11-03",
      age: 26,
      region: "Andijon",
      interests: ["Sport & Fitnes", "Kulinariya", "Suhbatlashish", "Futbol"],
      phone_number: "+998998887766",
      is_profile_complete: true,
      views_count: 96,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "u5-malika",
      user_id: 105,
      username: "malika_books",
      first_name: "Malika",
      bio: "Filolog & tarjimon 📚 Chet tillarini o'rganish va klassik adabiyotni sevuvchi qiz 🌸 Samimiy suhbatlarga ochiqman.",
      profile_pic: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
      gender: "female",
      birth_date: "2002-09-17",
      age: 22,
      region: "Farg'ona",
      interests: ["Kitobxonlik", "Suhbatlashish", "Kulinariya", "Musiqa"],
      phone_number: "+998912223344",
      is_profile_complete: true,
      views_count: 178,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "u6-jasur",
      user_id: 106,
      username: "jasur_gamer",
      first_name: "Jasur",
      bio: "Game developer & stream boshlovchi 🎮 Cyber sports va zamonaviy texnologiyalar olamida!",
      profile_pic: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
      gender: "male",
      birth_date: "2003-01-25",
      age: 21,
      region: "Toshkent shahri",
      interests: ["O'yinlar (Gaming)", "Dasturlash", "Kino & Seriallar", "Musiqa"],
      phone_number: "+998946665544",
      is_profile_complete: true,
      views_count: 64,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  posts: [
    {
      id: "p1",
      user_id: 101,
      caption: "Toshkentning quyoshli oqshomi va shinam qahvaxona muhiti ☀️ Yangi dizayn loyihalarim ustida ilhom bilan ishlayapman!",
      location: "Toshkent shahri, Amir Temur xiyoboni",
      images: [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80"
      ],
      likes_count: 42,
      comments_count: 5,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "p2",
      user_id: 103,
      caption: "Chorvoq tog'lari bo'ylab ajoyib sayohat 🏔️ Tabiatning har bir go'shasi o'zgacha go'zal!",
      location: "Chorvoq suv ombori, Bo'stonliq",
      images: [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80"
      ],
      likes_count: 76,
      comments_count: 8,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "p3",
      user_id: 102,
      caption: "Samarqand Registon maydoni kechki chiroqlarda yanada maftunkor ko'rinadi 🏛️ Tariximiz bilan faxrlanamiz!",
      location: "Registon maydoni, Samarqand",
      images: [
        "https://images.unsplash.com/photo-1528702748617-c64d49f918af?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop&q=80"
      ],
      likes_count: 54,
      comments_count: 4,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "p4",
      user_id: 105,
      caption: "Yangi kitob mutolaasi bilan o'tgan sokin dam olish kuni 📖 Hayotdagi eng yoqimli lahzalar!",
      location: "Farg'ona",
      images: [
        "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80"
      ],
      likes_count: 31,
      comments_count: 2,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "p5",
      user_id: 104,
      caption: "Ertalabki yugurish va fitnes mashg'uloti kun davomida ajoyib energiya beradi 💪 Siz ham sport bilan shug'ullanasizmi?",
      location: "Andijon shahar bog'i",
      images: [
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
      ],
      likes_count: 63,
      comments_count: 6,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  post_likes: [
    { id: "pl1", post_id: "p1", user_id: 102, created_at: new Date().toISOString() },
    { id: "pl2", post_id: "p2", user_id: 101, created_at: new Date().toISOString() }
  ],
  post_comments: [
    {
      id: "c1",
      post_id: "p1",
      user_id: 102,
      text: "Ajoyib kadrlar va juda chiroyli muhit! Qaysi qahvaxona bu? ☕",
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    },
    {
      id: "c2",
      post_id: "p1",
      user_id: 103,
      text: "Dizayn ishlaringizga omad, juda chiroyli uslub! 😍",
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: "c3",
      post_id: "p2",
      user_id: 101,
      text: "Chorvoq har doim ajoyib! Rasm sifati ham super 📸",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
    }
  ],
  dating_swipes: [
    { id: "sw1", sender_id: 101, target_id: 907402803, action: "like", created_at: new Date().toISOString() },
    { id: "sw2", sender_id: 103, target_id: 907402803, action: "like", created_at: new Date().toISOString() }
  ],
  matches: [],
  profile_views: []
};

// Helper to read JSON store
function getStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(SEED_DATA, null, 2), "utf8");
      return JSON.parse(JSON.stringify(SEED_DATA));
    }
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Store read error:", err);
    return JSON.parse(JSON.stringify(SEED_DATA));
  }
}

// Helper to write JSON store
function saveStore(data) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Store write error:", err);
  }
}

export const dbStore = {
  getStore,
  saveStore,

  // Calculate age from birth date string
  calculateAge(birthDateStr) {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  },

  // USERS
  async findUser(userId) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (data && !error) return data;
    } catch (e) {}

    const store = getStore();
    return store.users.find((u) => String(u.user_id) === String(userId)) || null;
  },

  async upsertUser(userData) {
    let supaUser = null;
    try {
      const { data, error } = await supabase
        .from("users")
        .upsert(userData, { onConflict: "user_id" })
        .select()
        .maybeSingle();
      if (data && !error) supaUser = data;
    } catch (e) {}

    const store = getStore();
    const idx = store.users.findIndex(
      (u) => String(u.user_id) === String(userData.user_id)
    );
    const calculatedAge =
      userData.age ||
      (userData.birth_date ? this.calculateAge(userData.birth_date) : null);

    const merged = {
      ...(idx >= 0 ? store.users[idx] : {}),
      ...userData,
      age: calculatedAge || (idx >= 0 ? store.users[idx].age : null),
      updated_at: new Date().toISOString()
    };

    if (idx >= 0) {
      store.users[idx] = merged;
    } else {
      merged.id = merged.id || `u_${Date.now()}`;
      merged.created_at = merged.created_at || new Date().toISOString();
      merged.views_count = merged.views_count || 0;
      store.users.push(merged);
    }
    saveStore(store);
    return supaUser || merged;
  },

  async recordProfileView(viewerId, profileId) {
    if (String(viewerId) === String(profileId)) return;

    const store = getStore();
    const user = store.users.find((u) => String(u.user_id) === String(profileId));
    if (user) {
      user.views_count = (user.views_count || 0) + 1;
      store.profile_views.push({
        id: `pv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        viewer_id: viewerId,
        profile_id: profileId,
        created_at: new Date().toISOString()
      });
      saveStore(store);
    }
  },

  // POSTS & RECOMMENDATIONS
  async getPosts(options = {}) {
    const {
      currentUserId,
      region,
      gender,
      ageMin,
      ageMax,
      interest,
      search,
      authorUserId
    } = options;

    const store = getStore();
    let currentUser = null;
    if (currentUserId) {
      currentUser = await this.findUser(currentUserId);
    }

    let postsList = store.posts;

    let enriched = postsList.map((post) => {
      const author =
        store.users.find((u) => String(u.user_id) === String(post.user_id)) || {
          user_id: post.user_id,
          first_name: "Foydalanuvchi",
          username: "user",
          profile_pic: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          region: "Toshkent",
          gender: "other",
          interests: []
        };

      const hasLiked = store.post_likes.some(
        (pl) =>
          String(pl.post_id) === String(post.id) &&
          String(pl.user_id) === String(currentUserId)
      );

      const postComments = store.post_comments
        .filter((c) => String(c.post_id) === String(post.id))
        .map((c) => {
          const commentAuthor = store.users.find(
            (u) => String(u.user_id) === String(c.user_id)
          ) || {
            first_name: "Foydalanuvchi",
            profile_pic: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
          };
          return {
            ...c,
            author_name: commentAuthor.first_name,
            author_pic: commentAuthor.profile_pic,
            author_username: commentAuthor.username
          };
        });

      return {
        ...post,
        author: {
          id: author.id,
          user_id: author.user_id,
          first_name: author.first_name,
          username: author.username,
          profile_pic: author.profile_pic,
          gender: author.gender,
          region: author.region,
          age: author.age || this.calculateAge(author.birth_date),
          interests: author.interests || []
        },
        hasLiked,
        likes_count: store.post_likes.filter(
          (pl) => String(pl.post_id) === String(post.id)
        ).length || post.likes_count || 0,
        comments_count: postComments.length || post.comments_count || 0,
        comments: postComments
      };
    });

    // 1. FILTERING
    if (authorUserId) {
      enriched = enriched.filter(
        (p) => String(p.user_id) === String(authorUserId)
      );
    }

    if (region && region !== "all") {
      enriched = enriched.filter(
        (p) =>
          p.author?.region?.toLowerCase() === region.toLowerCase() ||
          p.location?.toLowerCase().includes(region.toLowerCase())
      );
    }

    if (gender && gender !== "all") {
      enriched = enriched.filter((p) => p.author?.gender === gender);
    }

    if (ageMin || ageMax) {
      enriched = enriched.filter((p) => {
        const age = p.author?.age;
        if (!age) return true;
        if (ageMin && age < parseInt(ageMin, 10)) return false;
        if (ageMax && age > parseInt(ageMax, 10)) return false;
        return true;
      });
    }

    if (interest && interest !== "all") {
      enriched = enriched.filter((p) =>
        p.author?.interests?.some(
          (i) => i.toLowerCase() === interest.toLowerCase()
        )
      );
    }

    if (search && search.trim()) {
      const q = search.toLowerCase();
      enriched = enriched.filter(
        (p) =>
          p.caption?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.author?.first_name?.toLowerCase().includes(q) ||
          p.author?.interests?.some((i) => i.toLowerCase().includes(q))
      );
    }

    // 2. RECOMMENDATION ALGORITHM SCORING
    if (!authorUserId && currentUser) {
      enriched = enriched.map((item) => {
        let score = 50;

        if (currentUser.gender && item.author?.gender) {
          if (
            (currentUser.gender === "male" && item.author.gender === "female") ||
            (currentUser.gender === "female" && item.author.gender === "male")
          ) {
            score += 35;
          }
        }

        if (
          currentUser.region &&
          item.author?.region &&
          currentUser.region.toLowerCase() === item.author.region.toLowerCase()
        ) {
          score += 30;
        }

        const myInterests = Array.isArray(currentUser.interests)
          ? currentUser.interests
          : [];
        const authorInterests = Array.isArray(item.author?.interests)
          ? item.author.interests
          : [];
        const shared = myInterests.filter((mi) =>
          authorInterests.some((ai) => ai.toLowerCase() === mi.toLowerCase())
        );
        score += Math.min(shared.length * 15, 60);

        score += (item.likes_count || 0) * 2 + (item.comments_count || 0) * 3;

        const hoursAgo =
          (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 24) {
          score += 20;
        } else if (hoursAgo < 72) {
          score += 10;
        }

        return { ...item, recommendationScore: score, sharedInterests: shared };
      });

      enriched.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
    } else {
      enriched.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return enriched;
  },

  async createPost(postData) {
    const newPost = {
      id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: postData.user_id,
      caption: postData.caption || "",
      location: postData.location || "",
      images: postData.images || [],
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const store = getStore();
    store.posts.unshift(newPost);
    saveStore(store);

    return newPost;
  },

  async toggleLikePost(postId, userId) {
    const store = getStore();
    const existingIdx = store.post_likes.findIndex(
      (pl) =>
        String(pl.post_id) === String(postId) &&
        String(pl.user_id) === String(userId)
    );

    let hasLiked = false;
    if (existingIdx >= 0) {
      store.post_likes.splice(existingIdx, 1);
      hasLiked = false;
    } else {
      store.post_likes.push({
        id: `pl_${Date.now()}`,
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString()
      });
      hasLiked = true;
    }

    const likesCount = store.post_likes.filter(
      (pl) => String(pl.post_id) === String(postId)
    ).length;

    const post = store.posts.find((p) => String(p.id) === String(postId));
    if (post) {
      post.likes_count = likesCount;
    }
    saveStore(store);

    return { hasLiked, likesCount };
  },

  async addComment(postId, userId, text) {
    const store = getStore();
    const comment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      post_id: postId,
      user_id: userId,
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    store.post_comments.push(comment);

    const post = store.posts.find((p) => String(p.id) === String(postId));
    if (post) {
      post.comments_count = (post.comments_count || 0) + 1;
    }
    saveStore(store);

    const author = store.users.find((u) => String(u.user_id) === String(userId)) || {
      first_name: "Foydalanuvchi",
      profile_pic: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    };

    return {
      ...comment,
      author_name: author.first_name,
      author_pic: author.profile_pic,
      author_username: author.username
    };
  },

  async getComments(postId) {
    const store = getStore();
    const comments = store.post_comments
      .filter((c) => String(c.post_id) === String(postId))
      .map((c) => {
        const author = store.users.find(
          (u) => String(u.user_id) === String(c.user_id)
        ) || {
          first_name: "Foydalanuvchi",
          profile_pic: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        };
        return {
          ...c,
          author_name: author.first_name,
          author_pic: author.profile_pic,
          author_username: author.username
        };
      });

    return comments.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  },

  // DATING SWIPES & MATCHES
  async getDatingCandidates(currentUserId, filters = {}) {
    const store = getStore();
    const currentUser = await this.findUser(currentUserId);
    if (!currentUser) return [];

    const myGender = currentUser.gender;
    const targetGender = myGender === "male" ? "female" : "male";

    const swipedTargetIds = new Set(
      store.dating_swipes
        .filter((s) => String(s.sender_id) === String(currentUserId))
        .map((s) => String(s.target_id))
    );

    let candidates = store.users.filter((u) => {
      if (String(u.user_id) === String(currentUserId)) return false;
      if (myGender && u.gender !== targetGender) return false;
      if (swipedTargetIds.has(String(u.user_id))) return false;
      return true;
    });

    if (filters.region && filters.region !== "all") {
      candidates = candidates.filter(
        (c) => c.region?.toLowerCase() === filters.region.toLowerCase()
      );
    }
    if (filters.ageMin || filters.ageMax) {
      candidates = candidates.filter((c) => {
        const age = c.age || this.calculateAge(c.birth_date);
        if (!age) return true;
        if (filters.ageMin && age < parseInt(filters.ageMin, 10)) return false;
        if (filters.ageMax && age > parseInt(filters.ageMax, 10)) return false;
        return true;
      });
    }

    const myInterests = Array.isArray(currentUser.interests)
      ? currentUser.interests
      : [];

    return candidates.map((c) => {
      const cInterests = Array.isArray(c.interests) ? c.interests : [];
      const shared = myInterests.filter((mi) =>
        cInterests.some((ci) => ci.toLowerCase() === mi.toLowerCase())
      );

      let compatibility = 65;
      compatibility += shared.length * 10;
      if (
        currentUser.region &&
        c.region &&
        currentUser.region.toLowerCase() === c.region.toLowerCase()
      ) {
        compatibility += 15;
      }
      compatibility = Math.min(Math.max(compatibility, 55), 98);

      return {
        id: c.id,
        user_id: c.user_id,
        first_name: c.first_name,
        username: c.username,
        bio: c.bio || "Salom! Yaqin ilovasida yangi tanishuvlarga ochiqman 😊",
        profile_pic: c.profile_pic,
        gender: c.gender,
        region: c.region,
        age: c.age || this.calculateAge(c.birth_date),
        interests: c.interests || [],
        compatibility,
        sharedInterests: shared
      };
    });
  },

  async handleSwipe(senderId, targetId, action) {
    const store = getStore();

    const swipeRecord = {
      id: `sw_${Date.now()}`,
      sender_id: senderId,
      target_id: targetId,
      action,
      created_at: new Date().toISOString()
    };

    const existingIdx = store.dating_swipes.findIndex(
      (s) =>
        String(s.sender_id) === String(senderId) &&
        String(s.target_id) === String(targetId)
    );
    if (existingIdx >= 0) {
      store.dating_swipes[existingIdx] = swipeRecord;
    } else {
      store.dating_swipes.push(swipeRecord);
    }

    let isMatch = false;
    let matchRecord = null;
    const targetUser = store.users.find(
      (u) => String(u.user_id) === String(targetId)
    );

    if (action === "like" || action === "superlike") {
      const mutualSwipe = store.dating_swipes.find(
        (s) =>
          String(s.sender_id) === String(targetId) &&
          String(s.target_id) === String(senderId) &&
          (s.action === "like" || s.action === "superlike")
      );

      if (mutualSwipe || action === "superlike") {
        isMatch = true;
        matchRecord = {
          id: `m_${Date.now()}`,
          user1_id: senderId,
          user2_id: targetId,
          created_at: new Date().toISOString()
        };

        const existingMatch = store.matches.find(
          (m) =>
            (String(m.user1_id) === String(senderId) &&
              String(m.user2_id) === String(targetId)) ||
            (String(m.user1_id) === String(targetId) &&
              String(m.user2_id) === String(senderId))
        );

        if (!existingMatch) {
          store.matches.push(matchRecord);
        }
      }
    }

    saveStore(store);

    return {
      success: true,
      action,
      isMatch,
      matchedUser: isMatch ? targetUser : null,
      match: matchRecord
    };
  },

  async getMatches(currentUserId) {
    const store = getStore();
    const userMatches = store.matches.filter(
      (m) =>
        String(m.user1_id) === String(currentUserId) ||
        String(m.user2_id) === String(currentUserId)
    );

    const populated = userMatches.map((m) => {
      const otherUserId =
        String(m.user1_id) === String(currentUserId) ? m.user2_id : m.user1_id;
      const otherUser = store.users.find(
        (u) => String(u.user_id) === String(otherUserId)
      ) || {
        first_name: "Yaqin Do'st",
        profile_pic: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      };

      return {
        match_id: m.id,
        matched_at: m.created_at,
        user: {
          user_id: otherUser.user_id,
          first_name: otherUser.first_name,
          username: otherUser.username,
          profile_pic: otherUser.profile_pic,
          gender: otherUser.gender,
          region: otherUser.region,
          bio: otherUser.bio,
          age: otherUser.age || this.calculateAge(otherUser.birth_date),
          interests: otherUser.interests || []
        }
      };
    });

    return populated;
  },

  // USER ANALYTICS
  async getUserAnalytics(userId) {
    const store = getStore();
    const user = store.users.find((u) => String(u.user_id) === String(userId));
    if (!user) return null;

    const userPosts = store.posts.filter(
      (p) => String(p.user_id) === String(userId)
    );
    const postIds = new Set(userPosts.map((p) => String(p.id)));

    const totalPostLikes = store.post_likes.filter((pl) =>
      postIds.has(String(pl.post_id))
    ).length;

    const datingLikesReceived = store.dating_swipes.filter(
      (s) =>
        String(s.target_id) === String(userId) &&
        (s.action === "like" || s.action === "superlike")
    ).length;

    const totalMatches = store.matches.filter(
      (m) =>
        String(m.user1_id) === String(userId) ||
        String(m.user2_id) === String(userId)
    ).length;

    const totalViews = user.views_count || 0;

    return {
      userId,
      viewsCount: totalViews,
      totalLikesReceived: totalPostLikes + datingLikesReceived,
      postLikesReceived: totalPostLikes,
      datingLikesReceived,
      totalPosts: userPosts.length,
      totalMatches,
      engagementRate:
        totalViews > 0
          ? Math.min(
              Math.round(((totalPostLikes + datingLikesReceived) / totalViews) * 100),
              100
            )
          : 85,
      recentViews: store.profile_views
        .filter((pv) => String(pv.profile_id) === String(userId))
        .slice(-10)
    };
  }
};
