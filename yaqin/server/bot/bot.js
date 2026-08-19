import { Telegraf, Markup } from "telegraf";
import { supabase } from "../supabase/supabase.js";

const token = process.env.BOT_TOKEN;

export const bot = token ? new Telegraf(token) : null;

if (bot) {
  // 1. Foydalanuvchi /start <OTP> orqali kelganda
  bot.start(async (ctx) => {
    const otpCode = String(ctx.payload).trim();

    if (!otpCode) {
      return ctx.reply(
        "Xush kelibsiz! Yaqin saytiga kirish uchun saytdagi havola orqali kiring."
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
        ])
      );
    } catch (err) {
      console.error("Start catch xatolik:", err);
      ctx.reply("Tizimda xatolik yuz berdi.");
    }
  });

  // 2. Foydalanuvchi "✅ Kirish" tugmasini bosganda
  bot.action(/^confirm_(.+)$/, async (ctx) => {
    const rawOtp = ctx.match[1].trim();

    try {
      const { data: session } = await supabase
        .from("telegram_auth_sessions")
        .select("*")
        .eq("otp_code", rawOtp)
        .eq("status", "pending")
        .maybeSingle();

      if (!session) {
        await ctx.answerCbQuery();
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
          { onConflict: "user_id" }
        )
        .select()
        .single();

      // Telegram Auth Session statusini o'zgartiramiz
      await supabase
        .from("telegram_auth_sessions")
        .update({ status: "verified", telegram_id: ctx.from.id })
        .eq("id", session.id);

      await ctx.answerCbQuery();
      await ctx.editMessageText("✅ Tasdiqlandi! Brauzerga qaytib davom etishingiz mumkin.");
    } catch (err) {
      console.error("Confirm error:", err);
    }
  });

  // 3. Foydalanuvchi "❌ Kirmaslik" tugmasini bosganda
  bot.action(/^cancel_(.+)$/, async (ctx) => {
    const otpCode = String(ctx.match[1]).trim();

    try {
      await supabase
        .from("telegram_auth_sessions")
        .update({ status: "cancelled" })
        .eq("otp_code", otpCode);

      await ctx.answerCbQuery();
      await ctx.editMessageText("🚫 Kirish rad etildi.");
    } catch (err) {
      console.error("Cancel catch xatolik:", err);
      ctx.answerCbQuery("Xatolik yuz berdi.");
    }
  });
}

export const startBot = () => {
  if (!bot) {
    console.log("ℹ️ Telegram BOT_TOKEN o'rnatilmagan. Bot ishga tushirilmadi (REST API ishlayveradi).");
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
