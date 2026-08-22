const API_BASE_URL =
  import.meta.env.VITE_SERVER_URL !== undefined
    ? import.meta.env.VITE_SERVER_URL
    : import.meta.env.PROD
      ? ""
      : "http://localhost:5001";

/**
 * Generic Fetch API client with automatic Bearer token injection
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If body is FormData, do not set Content-Type so browser sets boundary automatically
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Xatolik yuz berdi (${response.status})`);
    }

    return data;
  } catch (err) {
    console.error(
      `API Error on [${options.method || "GET"} ${endpoint}]:`,
      err.message,
    );
    throw err;
  }
}

export const api = {
  // Auth
  getTokenByOtp: (otpCode) =>
    request("/api/auth/token", {
      method: "POST",
      body: JSON.stringify({ otpCode }),
    }),

  googleAuth: (payload) =>
    request("/api/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // User Profile
  completeProfile: (formData) =>
    request("/api/user/complete-profile", {
      method: "POST",
      body: formData,
    }),

  getCurrentUser: () => request("/api/user/me"),

  updateProfile: (formData) =>
    request("/api/user/profile", {
      method: "PUT",
      body: formData,
    }),

  getUserProfile: (userId) => request(`/api/user/${userId}`),

  getUserAnalytics: () => request("/api/user/analytics/stats"),

  // Feed & Posts
  getPosts: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "" && v !== "all") {
        query.append(k, v);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/posts${qs}`);
  },

  createPost: (formData) =>
    request("/api/posts", {
      method: "POST",
      body: formData,
    }),

  toggleLikePost: (postId) =>
    request(`/api/posts/${postId}/like`, {
      method: "POST",
    }),

  getPostComments: (postId) => request(`/api/posts/${postId}/comments`),

  addPostComment: (postId, text) =>
    request(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  // Dating / Swipe
  // Dating / Swipe
  getDatingCards: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      // gender "all" bo'lsa ham query'ga qo'shiladi (?gender=all bo'lib ketadi)
      if (v !== undefined && v !== null && v !== "") {
        if (k === "region" && v === "all") {
          // region "all" bo'lsa yubormasa ham bo'laveradi
          return;
        }
        query.append(k, v);
      }
    });
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request(`/api/dating/cards${qs}`);
  },

  swipeCandidate: (targetId, action) =>
    request("/api/dating/swipe", {
      method: "POST",
      body: JSON.stringify({ targetId, action }),
    }),

  getMatches: () => request("/api/dating/matches"),

  // Realtime Chat Messages
  getChatMessages: (partnerId) => request(`/api/messages/${partnerId}`),

  sendMessage: (partnerId, text) =>
    request(`/api/messages/${partnerId}`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  deleteMatch: (matchId) =>
    request(`/api/dating/matches/${matchId}`, {
      method: "DELETE",
    }),
};
