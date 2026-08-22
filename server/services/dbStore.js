import { supabase } from "../supabase/supabase.js";

export const dbStore = {
  // 1. Calculate age from birth date string (YYYY-MM-DD)
  calculateAge(birthDateStr) {
    if (!birthDateStr) return null;
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  },

  // 2. USERS
  async findUser(userId) {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", Number(userId))
        .maybeSingle();

      if (error) {
        console.warn("Supabase findUser error:", error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error("findUser exception:", err);
      return null;
    }
  },

  async upsertUser(userData) {
    if (!userData || !userData.user_id) {
      throw new Error("user_id is required for upsertUser");
    }

    const calculatedAge =
      userData.age ||
      (userData.birth_date ? this.calculateAge(userData.birth_date) : null);

    const payload = {
      ...userData,
      user_id: Number(userData.user_id),
      updated_at: new Date().toISOString(),
    };

    if (calculatedAge) {
      payload.age = calculatedAge;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

      if (error) {
        console.error("Supabase upsertUser error:", error.message);
        throw error;
      }
      return data;
    } catch (err) {
      console.error("upsertUser exception:", err);
      throw err;
    }
  },

  async recordProfileView(viewerId, profileId) {
    if (!viewerId || !profileId || String(viewerId) === String(profileId))
      return;

    try {
      // 1. Insert into profile_views
      await supabase.from("profile_views").insert({
        viewer_id: Number(viewerId),
        profile_id: Number(profileId),
        created_at: new Date().toISOString(),
      });

      // 2. Increment views_count in users table
      const { data: u } = await supabase
        .from("users")
        .select("views_count")
        .eq("user_id", Number(profileId))
        .maybeSingle();

      const newViews = (u?.views_count || 0) + 1;
      await supabase
        .from("users")
        .update({ views_count: newViews, updated_at: new Date().toISOString() })
        .eq("user_id", Number(profileId));
    } catch (err) {
      console.warn("recordProfileView error:", err.message);
    }
  },

  // 3. POSTS & FEED
  async getPosts(options = {}) {
    const {
      currentUserId,
      region,
      gender,
      ageMin,
      ageMax,
      interest,
      search,
      authorUserId,
    } = options;

    try {
      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (authorUserId) {
        query = query.eq("user_id", Number(authorUserId));
      }

      const { data: rawPosts, error: postsError } = await query;
      if (postsError) {
        console.warn("Supabase getPosts error:", postsError.message);
        return [];
      }

      if (!rawPosts || rawPosts.length === 0) {
        return [];
      }

      // Fetch authors for all posts
      const userIds = [...new Set(rawPosts.map((p) => Number(p.user_id)))];
      const { data: authors } = await supabase
        .from("users")
        .select("*")
        .in("user_id", userIds);

      const authorsMap = new Map(
        (authors || []).map((a) => [String(a.user_id), a]),
      );

      // Fetch like statuses for current user
      const postIds = rawPosts.map((p) => p.id);
      let likedSet = new Set();
      if (currentUserId) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", Number(currentUserId))
          .in("post_id", postIds);

        likedSet = new Set((likes || []).map((l) => String(l.post_id)));
      }

      // Fetch comments
      const { data: allComments } = await supabase
        .from("post_comments")
        .select("*")
        .in("post_id", postIds)
        .order("created_at", { ascending: true });

      const commentUserIds = [
        ...new Set((allComments || []).map((c) => Number(c.user_id))),
      ];
      let commentAuthorsMap = new Map();
      if (commentUserIds.length > 0) {
        const { data: commentAuthors } = await supabase
          .from("users")
          .select("user_id, first_name, username, profile_pic, profile_sticker")
          .in("user_id", commentUserIds);

        commentAuthorsMap = new Map(
          (commentAuthors || []).map((ca) => [String(ca.user_id), ca]),
        );
      }

      let currentUser = null;
      if (currentUserId) {
        currentUser = await this.findUser(currentUserId);
      }

      // Enrich posts
      let enriched = rawPosts.map((post) => {
        const author = authorsMap.get(String(post.user_id)) || {
          user_id: post.user_id,
          first_name: "Foydalanuvchi",
          username: null,
          profile_pic: null,
          gender: "other",
          region: "Toshkent",
          interests: [],
        };

        const postComments = (allComments || [])
          .filter((c) => String(c.post_id) === String(post.id))
          .map((c) => {
            const commentAuthor = commentAuthorsMap.get(String(c.user_id)) || {
              first_name: "Foydalanuvchi",
              profile_pic: null,
              username: null,
            };
            return {
              ...c,
              author_name: commentAuthor.first_name,
              author_pic: commentAuthor.profile_pic,
              author_username: commentAuthor.username,
            };
          });

        const hasLiked = likedSet.has(String(post.id));

        return {
          ...post,
          images: Array.isArray(post.images)
            ? post.images
            : typeof post.images === "string"
              ? JSON.parse(post.images || "[]")
              : [],
          author: {
            id: author.id,
            user_id: author.user_id,
            first_name: author.first_name,
            username: author.username,
            profile_pic: author.profile_pic,
            profile_sticker: author.profile_sticker || null,
            gender: author.gender,
            region: author.region,
            age: author.age || this.calculateAge(author.birth_date),
            interests: Array.isArray(author.interests) ? author.interests : [],
          },
          hasLiked,
          likes_count: post.likes_count ?? 0,
          comments_count: postComments.length ?? post.comments_count ?? 0,
          comments: postComments,
        };
      });

      // 1. FILTERING
      if (region && region !== "all") {
        enriched = enriched.filter(
          (p) =>
            p.author?.region?.toLowerCase() === region.toLowerCase() ||
            p.location?.toLowerCase().includes(region.toLowerCase()),
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
            (i) => i.toLowerCase() === interest.toLowerCase(),
          ),
        );
      }

      if (search && search.trim()) {
        const q = search.toLowerCase();
        enriched = enriched.filter(
          (p) =>
            p.caption?.toLowerCase().includes(q) ||
            p.location?.toLowerCase().includes(q) ||
            p.author?.first_name?.toLowerCase().includes(q) ||
            p.author?.interests?.some((i) => i.toLowerCase().includes(q)),
        );
      }

      // 2. RECOMMENDATION ALGORITHM SCORING
      if (!authorUserId && currentUser) {
        enriched = enriched.map((item) => {
          let score = 50;

          if (currentUser.gender && item.author?.gender) {
            if (
              (currentUser.gender === "male" &&
                item.author.gender === "female") ||
              (currentUser.gender === "female" && item.author.gender === "male")
            ) {
              score += 35;
            }
          }

          if (
            currentUser.region &&
            item.author?.region &&
            currentUser.region.toLowerCase() ===
              item.author.region.toLowerCase()
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
            authorInterests.some((ai) => ai.toLowerCase() === mi.toLowerCase()),
          );
          score += Math.min(shared.length * 15, 60);

          score += (item.likes_count || 0) * 2 + (item.comments_count || 0) * 3;

          const hoursAgo =
            (Date.now() - new Date(item.created_at).getTime()) /
            (1000 * 60 * 60);
          if (hoursAgo < 24) {
            score += 20;
          } else if (hoursAgo < 72) {
            score += 10;
          }

          return {
            ...item,
            recommendationScore: score,
            sharedInterests: shared,
          };
        });

        enriched.sort(
          (a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0),
        );
      } else {
        enriched.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      }

      return enriched;
    } catch (err) {
      console.error("getPosts exception:", err);
      return [];
    }
  },

  async createPost(postData) {
    try {
      const payload = {
        user_id: Number(postData.user_id),
        caption: postData.caption || "",
        location: postData.location || "",
        images: postData.images || [],
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("posts")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Supabase createPost error:", error.message);
        throw error;
      }

      // Enrich with author info
      const author = await this.findUser(postData.user_id);
      return {
        ...data,
        author: author
          ? {
              id: author.id,
              user_id: author.user_id,
              first_name: author.first_name,
              username: author.username,
              profile_pic: author.profile_pic,
              profile_sticker: author.profile_sticker || null,
              gender: author.gender,
              region: author.region,
              age: author.age || this.calculateAge(author.birth_date),
              interests: author.interests || [],
            }
          : null,
      };
    } catch (err) {
      console.error("createPost exception:", err);
      throw err;
    }
  },

  async toggleLikePost(postId, userId) {
    try {
      const cleanUserId = Number(userId);

      // Check if user already liked
      const { data: existing } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", cleanUserId)
        .maybeSingle();

      let hasLiked = false;
      if (existing) {
        await supabase.from("post_likes").delete().eq("id", existing.id);
        hasLiked = false;
      } else {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: cleanUserId,
          created_at: new Date().toISOString(),
        });
        hasLiked = true;
      }

      // Count total likes
      const { count } = await supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

      const likesCount = count || 0;
      await supabase
        .from("posts")
        .update({
          likes_count: likesCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      return { hasLiked, likesCount };
    } catch (err) {
      console.error("toggleLikePost exception:", err);
      throw err;
    }
  },

  async addComment(postId, userId, text) {
    try {
      const cleanUserId = Number(userId);
      const { data: comment, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: cleanUserId,
          text: text.trim(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase addComment error:", error.message);
        throw error;
      }

      // Recount comments
      const { count } = await supabase
        .from("post_comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId);

      const commentsCount = count || 1;
      await supabase
        .from("posts")
        .update({
          comments_count: commentsCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      const author = await this.findUser(cleanUserId);
      return {
        ...comment,
        author_name: author?.first_name || "Foydalanuvchi",
        author_pic: author?.profile_pic || null,
        author_username: author?.username || null,
        author_sticker: author?.profile_sticker || null,
      };
    } catch (err) {
      console.error("addComment exception:", err);
      throw err;
    }
  },

  async getComments(postId) {
    try {
      const { data: comments, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error || !comments) return [];

      const userIds = [...new Set(comments.map((c) => Number(c.user_id)))];
      const { data: authors } = await supabase
        .from("users")
        .select("user_id, first_name, username, profile_pic, profile_sticker")
        .in("user_id", userIds);

      const authorsMap = new Map(
        (authors || []).map((a) => [String(a.user_id), a]),
      );

      return comments.map((c) => {
        const author = authorsMap.get(String(c.user_id)) || {
          first_name: "Foydalanuvchi",
        };
        return {
          ...c,
          author_name: author.first_name,
          author_pic: author.profile_pic,
          author_username: author.username,
          author_sticker: author.profile_sticker || null,
        };
      });
    } catch (err) {
      console.error("getComments exception:", err);
      return [];
    }
  },

  // 4. DATING SWIPES & MATCHES
  async getDatingCandidates(currentUserId, filters = {}) {
    try {
      const currentUser = await this.findUser(currentUserId);
      if (!currentUser) return [];

      // 1. Jins filtrini belgilash
      // Agar filters.gender kelgan bo'lsa, shuni oladi.
      // Aks holda sukut bo'yicha (default) qarama-qarshi jins olinadi.
      let selectedGender = filters.gender;
      if (!selectedGender) {
        const myGender = currentUser.gender;
        selectedGender =
          myGender === "male"
            ? "female"
            : myGender === "female"
              ? "male"
              : "all";
      }

      // Swiped qilingan foydalanuvchilar ID'sini olish
      const { data: swipes } = await supabase
        .from("dating_swipes")
        .select("target_id")
        .eq("sender_id", Number(currentUserId));

      const swipedIds = new Set((swipes || []).map((s) => Number(s.target_id)));
      swipedIds.add(Number(currentUserId)); // O'zini ro'yxatdan chiqarish

      let query = supabase.from("users").select("*");

      // 2. Agar selectedGender "all" bo'lmasa, ma'lum jins bo'yicha filter qilamiz
      if (selectedGender && selectedGender !== "all") {
        query = query.eq("gender", selectedGender);
      }

      const { data: allUsers, error } = await query;
      if (error || !allUsers) return [];

      // Allaqachon swipe qilinganlarni chiqarib tashlaymiz
      let candidates = allUsers.filter(
        (u) => !swipedIds.has(Number(u.user_id)),
      );

      // 3. Viloyat bo'yicha filtr
      if (filters.region && filters.region !== "all") {
        candidates = candidates.filter(
          (c) => c.region?.toLowerCase() === filters.region.toLowerCase(),
        );
      }

      // 4. Yosh bo'yicha filtr
      if (filters.ageMin || filters.ageMax) {
        candidates = candidates.filter((c) => {
          const age = c.age || this.calculateAge(c.birth_date);
          if (!age) return true;
          if (filters.ageMin && age < parseInt(filters.ageMin, 10))
            return false;
          if (filters.ageMax && age > parseInt(filters.ageMax, 10))
            return false;
          return true;
        });
      }

      const myInterests = Array.isArray(currentUser.interests)
        ? currentUser.interests
        : [];

      return candidates.map((c) => {
        const cInterests = Array.isArray(c.interests) ? c.interests : [];
        const shared = myInterests.filter((mi) =>
          cInterests.some((ci) => ci.toLowerCase() === mi.toLowerCase()),
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
          bio:
            c.bio || "Salom! Yaqin ilovasida yangi tanishuvlarga ochiqman 😊",
          profile_pic: c.profile_pic,
          gender: c.gender,
          region: c.region,
          age: c.age || this.calculateAge(c.birth_date),
          interests: c.interests || [],
          compatibility,
          sharedInterests: shared,
        };
      });
    } catch (err) {
      console.error("getDatingCandidates exception:", err);
      return [];
    }
  },

  async handleSwipe(senderId, targetId, action) {
    try {
      const cleanSenderId = Number(senderId);
      const cleanTargetId = Number(targetId);

      const { error: swipeErr } = await supabase.from("dating_swipes").upsert(
        {
          sender_id: cleanSenderId,
          target_id: cleanTargetId,
          action,
          created_at: new Date().toISOString(),
        },
        { onConflict: "sender_id,target_id" },
      );

      if (swipeErr) {
        console.warn("Swipe upsert warning:", swipeErr.message);
      }

      let isMatch = false;
      let matchRecord = null;
      const targetUser = await this.findUser(cleanTargetId);

      if (action === "like" || action === "superlike") {
        const { data: mutualSwipe } = await supabase
          .from("dating_swipes")
          .select("*")
          .eq("sender_id", cleanTargetId)
          .eq("target_id", cleanSenderId)
          .in("action", ["like", "superlike"])
          .maybeSingle();

        if (mutualSwipe || action === "superlike") {
          isMatch = true;

          // Check if match already exists
          const { data: existingMatch } = await supabase
            .from("matches")
            .select("*")
            .or(
              `and(user1_id.eq.${cleanSenderId},user2_id.eq.${cleanTargetId}),and(user1_id.eq.${cleanTargetId},user2_id.eq.${cleanSenderId})`,
            )
            .maybeSingle();

          if (!existingMatch) {
            const { data: newMatch } = await supabase
              .from("matches")
              .insert({
                user1_id: cleanSenderId,
                user2_id: cleanTargetId,
                created_at: new Date().toISOString(),
              })
              .select()
              .single();
            matchRecord = newMatch;
          } else {
            matchRecord = existingMatch;
          }
        }
      }

      return {
        success: true,
        action,
        isMatch,
        matchedUser: isMatch ? targetUser : null,
        match: matchRecord,
      };
    } catch (err) {
      console.error("handleSwipe exception:", err);
      throw err;
    }
  },

  async getMatches(currentUserId) {
    try {
      const cleanUserId = Number(currentUserId);
      const { data: userMatches, error } = await supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${cleanUserId},user2_id.eq.${cleanUserId}`)
        .order("created_at", { ascending: false });

      if (error || !userMatches || userMatches.length === 0) {
        return [];
      }

      const partnerIds = userMatches.map((m) =>
        Number(m.user1_id) === cleanUserId
          ? Number(m.user2_id)
          : Number(m.user1_id),
      );

      const { data: partnerUsers } = await supabase
        .from("users")
        .select("*")
        .in("user_id", partnerIds);

      const partnerMap = new Map(
        (partnerUsers || []).map((u) => [String(u.user_id), u]),
      );

      return userMatches.map((m) => {
        const partnerId =
          Number(m.user1_id) === cleanUserId
            ? Number(m.user2_id)
            : Number(m.user1_id);
        const otherUser = partnerMap.get(String(partnerId)) || {
          user_id: partnerId,
          first_name: "Yaqin Do'st",
          profile_pic: null,
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
            interests: otherUser.interests || [],
          },
        };
      });
    } catch (err) {
      console.error("getMatches exception:", err);
      return [];
    }
  },

  // 5. USER ANALYTICS
  async getUserAnalytics(userId) {
    try {
      const cleanUserId = Number(userId);
      const user = await this.findUser(cleanUserId);
      if (!user) return null;

      // Count posts
      const { data: userPosts } = await supabase
        .from("posts")
        .select("id, likes_count")
        .eq("user_id", cleanUserId);

      const postIds = (userPosts || []).map((p) => p.id);
      let postLikesReceived = 0;
      if (postIds.length > 0) {
        const { count } = await supabase
          .from("post_likes")
          .select("id", { count: "exact", head: true })
          .in("post_id", postIds);
        postLikesReceived = count || 0;
      }

      // Dating likes received
      const { count: datingLikesReceived } = await supabase
        .from("dating_swipes")
        .select("id", { count: "exact", head: true })
        .eq("target_id", cleanUserId)
        .in("action", ["like", "superlike"]);

      // Matches count
      const { count: totalMatches } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(`user1_id.eq.${cleanUserId},user2_id.eq.${cleanUserId}`);

      // Profile views
      const { data: recentViews, count: viewsCount } = await supabase
        .from("profile_views")
        .select("*", { count: "exact" })
        .eq("profile_id", cleanUserId)
        .order("created_at", { ascending: false })
        .limit(10);

      const totalViews = viewsCount || user.views_count || 0;
      const totalLikes = (postLikesReceived || 0) + (datingLikesReceived || 0);

      return {
        userId: cleanUserId,
        viewsCount: totalViews,
        totalLikesReceived: totalLikes,
        postLikesReceived: postLikesReceived || 0,
        datingLikesReceived: datingLikesReceived || 0,
        totalPosts: (userPosts || []).length,
        totalMatches: totalMatches || 0,
        engagementRate:
          totalViews > 0
            ? Math.min(Math.round((totalLikes / totalViews) * 100), 100)
            : 85,
        recentViews: recentViews || [],
      };
    } catch (err) {
      console.error("getUserAnalytics exception:", err);
      return null;
    }
  },

  // 6. REALTIME CHAT MESSAGES
  async getChatMessages(userId1, userId2) {
    try {
      const u1 = Number(userId1);
      const u2 = Number(userId2);

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${u1},receiver_id.eq.${u2}),and(sender_id.eq.${u2},receiver_id.eq.${u1})`,
        )
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("getChatMessages error:", error.message);
        return [];
      }
      return messages || [];
    } catch (err) {
      console.error("getChatMessages exception:", err);
      return [];
    }
  },

  async sendMessage(senderId, receiverId, text) {
    try {
      const cleanSender = Number(senderId);
      const cleanReceiver = Number(receiverId);

      const { data: message, error } = await supabase
        .from("messages")
        .insert({
          sender_id: cleanSender,
          receiver_id: cleanReceiver,
          text: text.trim(),
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("sendMessage error:", error.message);
        throw error;
      }
      return message;
    } catch (err) {
      console.error("sendMessage exception:", err);
      throw err;
    }
  },

  async markMessagesAsRead(senderId, receiverId) {
    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", Number(senderId))
        .eq("receiver_id", Number(receiverId))
        .eq("is_read", false);
    } catch (err) {
      console.warn("markMessagesAsRead error:", err.message);
    }
  },
};
