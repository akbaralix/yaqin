# ====================================================
# 1-Bosqich: Frontend (React + Vite) Build
# ====================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Frontend dependency fayllarini nusxalaymiz
COPY package*.json ./
RUN npm ci || npm install

# Frontend kodlarini nusxalaymiz
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src

# Build vaqtida kerak bo'ladigan o'zgaruvchilar
ARG VITE_SUPABASE_URL=https://kiwzebpbftpxmjzlrxzo.supabase.co
ARG VITE_SUPABASE_ANON_KEY=sb_publishable_SUguTwt-uxKFy-IAW9ORtg_mTPkrXw-
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Frontendni ishlab chiqarish (production) uchun yig'amiz (dist yaratiladi)
RUN npm run build

# ====================================================
# 2-Bosqich: Backend Server & Production Runner
# ====================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Muhit o'zgaruvchilari
ENV NODE_ENV=production
ENV PORT=5001

# Backend server paketlarini o'rnatamiz (faqat production dependencylar)
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund

# Backend server kodlarini nusxalaymiz
COPY server ./server

# 1-bosqichda yig'ilgan frontend dist papkasini nusxalaymiz
COPY --from=builder /app/dist ./dist

# Server portini ochamiz
EXPOSE 5001

# Xavfsizlik uchun root bo'lmagan node foydalanuvchisi
USER node

# Serverni ishga tushiramiz
CMD ["node", "server/server.js"]
