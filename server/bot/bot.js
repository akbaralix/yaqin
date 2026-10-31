import { Telegraf, Markup } from "telegraf";
import { supabase } from "../supabase/supabase.js";
import path from "path";
import { fileURLToPath } from "url";

const token = process.env.BOT_TOKEN;
const adminId = "907402803";

// Vaqtincha xabarlarni saqlash uchun
let pendingBroadcast = null;

export const bot = token ? new Telegraf(token) : null;

if (bot) {
  // Global xatolik ushlash (Bot crash bo'lishini oldini oladi)
  bot.catch((err, ctx) => {
    if (err.description?.includes("query is too old")) return;
    console.error(`Bot xatoligi (${ctx?.updateType}):`, err);
  });

  // 1. Foydalanuvchi /start <OTP> orqali kelganda
  bot.start(async (ctx) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const promoImage = path.join(__dirname, "YaqinPromo.png");
    const otpCode = String(ctx.payload || "").trim();

    if (!otpCode) {
      return ctx.replyWithPhoto(
        { source: promoImage },
        {
          caption: `<b>💜 Yaqin'ga xush kelibsiz! ${ctx.from.first_name} 👋</b>

Yangi tanishuvlar, samimiy suhbatlar va balki siz izlagan inson — barchasi shu yerda 😉

<i>💜 Balki bugun aynan siz kutgan insonni toparsiz...</i>`,
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [
              Markup.button.webApp(
                "💜 Yaqin'ni ochish",
                "https://yaqin-uz.web.app",
              ),
            ],
          ]),
        },
      );
    }

    try {
      const { data: session, error } = await supabase
        .from("telegram_auth_sessions")
        .select("*")
        .eq("otp_code", otpCode)
        .eq("status", "pending")
        .single();

      if (error || !session) {
        console.error("Start OTP xatosi:", error || "Sessiya topilmadi");
        return ctx.reply("❌ Kod xato, eskirgan yoki allaqachon ishlatilgan.");
      }

      await ctx.reply(
        `👋 Salom, ${ctx.from.first_name}!\n\nYaqin ilovasiga kirishni tasdiqlaysizmi?`,
        Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ Kirish", `confirm_${otpCode}`),
            Markup.button.callback("❌ Kirmaslik", `cancel_${otpCode}`),
          ],
        ]),
      );
    } catch (err) {
      console.error("Start catch xatolik:", err);
      ctx.reply("Tizimda xatolik yuz berdi.");
    }
  });

  // 2. Foydalanuvchi "✅ Kirish" tugmasini bosganda
  bot.action(/^confirm_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});

    const rawOtp = ctx.match[1].trim();

    try {
      const { data: session } = await supabase
        .from("telegram_auth_sessions")
        .select("*")
        .eq("otp_code", rawOtp)
        .eq("status", "pending")
        .maybeSingle();

      if (!session) {
        return ctx.editMessageText("❌ Sessiya eskirgan yoki topilmadi.");
      }

      // Users jadvalida bor bo'lsa yangilaymiz, yo'q bo'lsa yaratamiz
      await supabase
        .from("users")
        .upsert(
          {
            user_id: ctx.from.id,
            first_name: ctx.from.first_name,
            username: ctx.from.username || null,
          },
          { onConflict: "user_id" },
        )
        .select()
        .single();

      // Telegram Auth Session statusini o'zgartiramiz
      await supabase
        .from("telegram_auth_sessions")
        .update({ status: "verified", telegram_id: ctx.from.id })
        .eq("id", session.id);

      await ctx.editMessageText(
        "✅ Tasdiqlandi! Brauzerga qaytib davom etishingiz mumkin.",
        Markup.inlineKeyboard([
          [Markup.button.url("💜 Saytga qaytish", "https://yaqin-uz.web.app")],
        ]),
      );
    } catch (err) {
      console.error("Confirm error:", err);
      await ctx
        .editMessageText("❌ Kirishni tasdiqlashda xatolik yuz berdi.")
        .catch(() => {});
    }
  });

  // 3. Foydalanuvchi "❌ Kirmaslik" tugmasini bosganda
  bot.action(/^cancel_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});

    const otpCode = String(ctx.match[1]).trim();

    try {
      await supabase
        .from("telegram_auth_sessions")
        .update({ status: "cancelled" })
        .eq("otp_code", otpCode);

      await ctx.editMessageText("🚫 Kirish rad etildi.");
    } catch (err) {
      console.error("Cancel catch xatolik:", err);
      await ctx
        .editMessageText("❌ Amalni bekor qilishda xatolik yuz berdi.")
        .catch(() => {});
    }
  });

  // ==========================================
  // 💜 YAQIN ADMIN PANEL
  // ==========================================

  const isAdmin = (ctx) => {
    return String(ctx.from?.id) === String(adminId);
  };

  // Admin menyusi
  const adminMenu = () => {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("📊 Statistika", "admin:stats"),
        Markup.button.callback("👥 Foydalanuvchilar", "admin:users"),
      ],
      [
        Markup.button.callback("🔍 User qidirish", "admin:search"),
        Markup.button.callback("📢 Xabar yuborish", "admin:broadcast"),
      ],
      [Markup.button.callback("🔄 Yangilash", "admin:stats")],
    ]);
  };

  // Admin uchun kirish
  bot.command("admin", async (ctx) => {
    if (!isAdmin(ctx)) return;

    await ctx.reply(
      `💜 YAQIN ADMIN PANEL\n\nXush kelibsiz, ${ctx.from.first_name}!\n\nKerakli bo'limni tanlang:`,
      adminMenu(),
    );
  });

  // Har bir admin tugmasini himoyalash
  bot.action(/^admin:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});

    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Sizda admin huquqi mavjud emas!");
    }

    const action = ctx.match[1];

    try {
      // 📊 STATISTIKA
      if (action === "stats") {
        const getCount = async (table) => {
          const { count, error } = await supabase
            .from(table)
            .select("*", { count: "exact", head: true });

          if (error) throw error;
          return count || 0;
        };

        const [users, posts, likes, follows, notifications] = await Promise.all(
          [
            getCount("users"),
            getCount("posts"),
            getCount("post_likes"),
            getCount("user_follows"),
            getCount("notifications"),
          ],
        );

        const message = `
📊 YAQIN STATISTIKA

👥 Jami foydalanuvchilar: ${users}
📝 Jami postlar: ${posts}
❤️ Jami like: ${likes}
➕ Jami obunalar: ${follows}
🔔 Jami bildirishnomalar: ${notifications}

💜 Yaqin Admin Panel
`;

        return ctx.editMessageText(message, adminMenu());
      }

      // 👥 FOYDALANUVCHILAR
      if (action === "users") {
        const { data, error, count } = await supabase
          .from("users")
          .select("user_id, first_name, username", {
            count: "exact",
          })
          .order("user_id", { ascending: false })
          .limit(10);

        if (error) throw error;

        let message = `👥 FOYDALANUVCHILAR\n\nJami: ${count || 0}\n\n`;

        for (const user of data || []) {
          message += `👤 ${user.first_name || "Nomsiz"}\n🆔 ${user.user_id}\nUsername: @${user.username || "yo'q"}\n\n`;
        }

        return ctx.editMessageText(
          message,
          Markup.inlineKeyboard([
            [Markup.button.callback("🔄 Yangilash", "admin:users")],
            [Markup.button.callback("⬅️ Orqaga", "admin:back")],
          ]),
        );
      }

      // 🔍 USER QIDIRISH
      if (action === "search") {
        return ctx.reply(
          "🔍 Foydalanuvchini qidirish uchun quyidagicha yozing:\n\n/user 123456789",
        );
      }

      // 📢 XABAR YUBORISH
      if (action === "broadcast") {
        return ctx.reply(
          `📢 OMMAVIY XABAR YUBORISH\n\nBarcha foydalanuvchilarga xabar yuborish uchun:\n\n/broadcast Salom! Yaqin yangiliklari bilan tanishing ❤️\n\nXabar yuborishdan oldin matnni tekshiring!`,
        );
      }

      // ⬅️ ORQAGA
      if (action === "back") {
        return ctx.editMessageText(
          "💜 YAQIN ADMIN PANEL\n\nKerakli bo'limni tanlang:",
          adminMenu(),
        );
      }
    } catch (err) {
      console.error("Admin panel error:", err);
      return ctx.reply("❌ Ma'lumotlarni olishda xatolik yuz berdi.");
    }
  });

  // 🔍 ID ORQALI USER QIDIRISH
  bot.command("user", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Ruxsat yo'q!");
    }

    const userId = Number(ctx.message.text.split(" ")[1]);

    if (!userId || !Number.isSafeInteger(userId)) {
      return ctx.reply("❌ To'g'ri ID kiriting!\n\n/user 123456789");
    }

    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        return ctx.reply("❌ Foydalanuvchi topilmadi.");
      }

      return ctx.reply(
        `👤 FOYDALANUVCHI MA'LUMOTLARI\n\n🆔 ID: ${user.user_id}\n👤 Ism: ${user.first_name || "Nomsiz"}\n🔗 Username: @${user.username || "yo'q"}`,
      );
    } catch (err) {
      console.error("User search error:", err);
      ctx.reply("❌ Qidirishda xatolik yuz berdi.");
    }
  });

  // 📢 BARCHA FOYDALANUVCHILARGA XABAR YUBORISH
  bot.command("broadcast", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Ruxsat yo'q!");
    }

    const message = ctx.message.text
      .replace(/^\/broadcast(@\w+)?\s*/i, "")
      .trim();

    if (!message) {
      return ctx.reply(
        "❌ Xabar matni kiritilmadi!\n\n/broadcast Salom, Yaqin foydalanuvchilari ❤️",
      );
    }

    const confirmation = await ctx.reply(
      `📢 XABARNI TASDIQLASH\n\n${message}\n\nUshbu xabar barcha foydalanuvchilarga yuborilsinmi?`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("✅ Yuborish", "admin:broadcast_confirm"),
          Markup.button.callback("❌ Bekor qilish", "admin:broadcast_cancel"),
        ],
      ]),
    );

    // Tasdiqlash uchun matnni vaqtincha saqlash
    pendingBroadcast = {
      adminId: String(ctx.from.id),
      message,
      messageId: confirmation.message_id,
    };
  });

  // Broadcastni tasdiqlash
  bot.action("admin:broadcast_confirm", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});

    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Ruxsat yo'q!");
    }

    const broadcast = pendingBroadcast;

    if (!broadcast || broadcast.adminId !== String(ctx.from.id)) {
      return ctx.reply(
        "❌ Yuboriladigan xabar topilmadi. Qaytadan urinib ko'ring.",
      );
    }

    // Ikki marta yuborilishining oldini olish
    pendingBroadcast = null;

    await ctx.editMessageText("⏳ Xabarlar yuborilmoqda...");

    let success = 0;
    let failed = 0;
    let offset = 0;
    const pageSize = 500;

    try {
      while (true) {
        const { data: users, error } = await supabase
          .from("users")
          .select("user_id")
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        if (!users || users.length === 0) break;

        for (const user of users) {
          try {
            if (!user.user_id) {
              failed++;
              continue;
            }

            await bot.telegram.sendMessage(user.user_id, broadcast.message);
            success++;

            // Telegram limitlariga rioya qilish
            await new Promise((resolve) => setTimeout(resolve, 50));
          } catch (err) {
            failed++;
            console.error(`Broadcast error (${user.user_id}):`, err.message);
          }
        }

        if (users.length < pageSize) break;
        offset += pageSize;
      }

      await ctx.reply(
        `✅ XABAR YUBORISH YAKUNLANDI\n\n📨 Muvaffaqiyatli: ${success}\n❌ Xatolik: ${failed}\n👥 Jami: ${success + failed}`,
      );
    } catch (err) {
      console.error("Broadcast error:", err);
      await ctx.reply(
        `❌ Broadcast jarayonida xatolik!\n\nYuborilgan: ${success}\nXatolik: ${failed}`,
      );
    }
  });

  // Broadcastni bekor qilish
  bot.action("admin:broadcast_cancel", async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});

    if (!isAdmin(ctx)) {
      return ctx.reply("⛔ Ruxsat yo'q!");
    }

    pendingBroadcast = null;

    return ctx.editMessageText("🚫 Xabar yuborish bekor qilindi.");
  });
}

export async function botSendNotification(chatId, text, userId = null) {
  if (!bot) return false;

  try {
    const webAppUrl = userId
      ? `https://yaqin-uz.web.app/profile/${userId}`
      : "https://yaqin-uz.web.app";

    await bot.telegram.sendMessage(chatId, text, {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.webApp("💜 Yaqin'ni ochish", webAppUrl)],
      ]),
    });

    return true;
  } catch (err) {
    console.error("Telegram notification error:", err.message);
    return false;
  }
}

export const startBot = () => {
  if (!bot) {
    console.log(
      "ℹ️ Telegram BOT_TOKEN o'rnatilmagan. Bot ishga tushirilmadi (REST API ishlayveradi).",
    );
    return;
  }

  bot
    .launch()
    .then(() => console.log("🤖 Telegram Bot muvaffaqiyatli ishga tushdi!"))
    .catch((err) => {
      console.warn("⚠️ Telegram Bot launch xatosi:", err.message);
    });

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};
