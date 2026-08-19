# 1. Node.js muhitini tanlaymiz
FROM node:20-alpine

# 2. Konteyner ichidagi ishchi papkani belgilaymiz
WORKDIR /app

# 3. package.json fayllarini nusxalaymiz
COPY package*.json ./

# 4. Kutubxonalarni o'rnatamiz
RUN npm install --production

# 5. Qolgan barcha fayllarni nusxalaymiz
COPY . .

# 6. Serverni ishga tushiramiz
EXPOSE 5000
CMD ["node", "server/server.js"]