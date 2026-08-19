# 💖 Yaqin — Zamonaviy Tanishuv va Ijtimoiy Tarmoq (Dating + Social Network)

**Yaqin** — O'zbekiston yoshlari uchun maxsus ishlab chiqilgan, zamonaviy UI/UX dizaynga ega, qulay tanishuv (Tinder-style swipe) va ijtimoiy tarmoq (Instagram-style feed & carousel) platformasi.

---

## 🌟 Asosiy Imkoniyatlar va Arxitektura

### 1. 🔐 Autentifikatsiya va Onboarding (Kirish & Profil)
- **Telegram Bot OTP & Google OAuth**: Telegram bot orqali tezkor va xavfsiz tasdiqlash hamda Google OAuth orqali kirish.
- **JWT Token & Route Guards**: Login bo'lganda profil to'liqligi (`is_profile_complete`) tekshiriladi. Agar to'liq bo'lmasa, majburiy `/complete-profile` yo'nalishiga o'tkaziladi.
- **Profil to'ldirish**: 2 bosqichli qulay wizard (Ism, Tug'ilgan sana, Viloyat, Jins, Bio, Rasm yuklash va 12+ qiziqishlar). Saqlangach, yangi JWT token qaytariladi va avtomatik `/` (Home) sahifasiga o'tadi.

### 2. 📱 Home Sahifa & Aqlli Tavsiya (Recommendation Feed)
- **Instagram uslubidagi Lenta**: Foydalanuvchilar postlari, joylashuv teglari, qiziqishlar va vaqt ko'rsatkichlari.
- **Dinamik Filtrlar Paneli**:
  - Viloyat / Manzil bo'yicha saralash
  - Jins (Barchasi, Ayollar, Erkaklar) bo'yicha filtr
  - Yosh oralig'i (18-22, 23-28, 29-35, 36+)
  - Qidiruv tizimi
- **Aqlli Tavsiya Algoritmi (Smart Ranking)**:
  - Qarama-qarshi jinsdagi insonlar postlariga ustuvorlik (+35 ball)
  - Bir xil viloyatdagi foydalanuvchilar postlari (+30 ball)
  - Umumiy qiziqishlar soniga qarab bonus (+15 ball har bir moslik uchun)
  - Postning yangiligi (recency) va mashhurligi (likes + comments) hisobga olinadi.

### 3. 📸 Post Yaratish va Interaktivlik
- **1 tadan 10 tagacha rasm yuklash**: Ko'p rasmli chiroyli Carousel ko'rinishida ko'rsatish (Chap/O'ng tugmalar, sahifa nuqtalari, rasm ustiga ikki marta bosganda yurak animatsiyasi).
- **Post Matni va Joylashuv**: Ixtiyoriy matn va manzil.
- **Like Toggle & Izohlar (Comments)**: Real-vaqtda like bosish/qaytarish, izohlar modal oynasi va izoh qoldirish.

### 4. 🔥 Tanishuv Bo'limi (Tinder Style Swipe)
- **Jins bo'yicha Avto-filtr**: Erkak foydalanuvchilarga faqat Ayollar, Ayol foydalanuvchilarga faqat Erkaklar profillari ko'rsatiladi.
- **Interaktiv Kartochkalar (Draggable & Touch Swipe)**: O'ngga surish (LIKE ❤️), Chapga surish (SKIP ❌), Superlike (🌟).
- **Moslik Foizi (Compatibility %)**: Umumiy qiziqishlar va manzilga qarab moslik darajasi avtomatik hisoblanadi.
- **O'zaro Match Tizimi**: Ikki tomon ham bir-biriga Like bosganda bayramona **"It's a Match! 🎉"** oynasi konfetti bilan ochiladi va suhbatni boshlash imkoniyati beriladi.

### 5. 📊 User Profili va Analitika
- **Profil Sahifasi**: Shaxsiy bio, qiziqishlar, viloyat, yosh va Instagram uslubidagi 3-ustunli postlar galereyasi.
- **Profil Tahrirlash**: Ism, rasm, bio, viloyat, yosh va qiziqishlarni istalgan payt o'zgartirish.
- **Profil Analitikasi (Dashboard)**:
  - Ko'rishlar soni (Views count)
  - To'plangan likelar statistikasi
  - Postlar va Matchlar soni
  - Faollik va qiziqish darajasi diagrammasi

### 6. 🎨 Responsive Mobile-First Dizayn
- **Mobil Qurilmalarda**: Qulay pastki navigatsiya paneli (**Bottom Navigation Bar**: Lenta, Tanishuv, Yangi Post, Matchlar, Profil).
- **Desktop Versiyada**: Chap tomonda zamonaviy Sidebar, o'rtada asosiy kontent va o'ng tomonda tavsiya etilgan do'stlar paneli.

---

## 🛠️ O'rnatish va Ishga Tushirish

### 1. Serverni Ishga Tushirish:
```bash
# Server papkasiga o'tish va paketlarni o'rnatish
cd server
npm install

# Backend serverni ishga tushirish (Port: 5001)
node server.js
```

### 2. Frontendni Ishga Tushirish:
```bash
# Asosiy papkada
npm install

# React + Vite ilovasini ishga tushirish
npm run dev
```

Brauzeringizda `http://localhost:5173` manzilini oching.

---

## 🗄️ Supabase Ma'lumotlar Bazasi

Supabase SQL muharririda barcha jadvallarni yaratish uchun `server/schema.sql` faylidagi SQL kodini ishga tushirishingiz mumkin.
Backend tizimida **Resilient Data Store** integratsiya qilingan bo'lib, jadvallar yaratilmagan holatda ham barcha funksiyalar (feed, swipe, like, match, analytics) to'liq va uzluksiz ishlaydi.
