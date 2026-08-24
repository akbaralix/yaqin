import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { SiTelegram } from "react-icons/si";
import { BsRobot, BsShieldCheck } from "react-icons/bs";
import { IoArrowBackOutline } from "react-icons/io5";
import toast from "react-hot-toast";

import { supabase } from "../../components/supabase/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import "./login.css";

function Login() {
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState("default");
  const [statusMessage, setStatusMessage] = useState("");
  const {
    loginWithToken,
    token,
    isProfileComplete,
    loading: authLoading,
  } = useAuth();

  const navigate = useNavigate();
  const channelRef = useRef(null);
  const isProcessingGoogle = useRef(false);

  // Tizimga kirgan bo'lsa yo'naltirish
  useEffect(() => {
    if (authLoading) return;
    if (token) {
      if (isProfileComplete) {
        navigate("/", { replace: true });
      } else {
        navigate("/complete-profile", { replace: true });
      }
    }
  }, [token, isProfileComplete, authLoading, navigate]);

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Google OAuth tinglovchisi (TUZATILGAN QISMI)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Faqat haqiqatdan ham Google provayderi orqali qaytgan bo'lsa ishlaydi
        const isGoogleProvider =
          session?.user?.app_metadata?.provider === "google";

        if (
          event === "SIGNED_IN" &&
          session?.user &&
          isGoogleProvider && // <<-- TUZATISH: Faqat Google provayderi bo'lsa
          !isProcessingGoogle.current
        ) {
          isProcessingGoogle.current = true;
          try {
            const googleUser = session.user;

            const rawGoogleId =
              googleUser.identities?.[0]?.identity_data?.sub ||
              googleUser.user_metadata?.sub ||
              googleUser.id;

            const res = await api.googleAuth({
              email: googleUser.email,
              name:
                googleUser.user_metadata?.full_name ||
                googleUser.user_metadata?.name ||
                "Foydalanuvchi",
              avatar: googleUser.user_metadata?.avatar_url,
              googleId: rawGoogleId,
            });

            if (res?.token) {
              loginWithToken(res.token, res.user);
              toast.success("Google orqali muvaffaqiyatli kirdingiz!");

              const isComplete = Boolean(
                res.is_profile_complete ||
                res.isProfileComplete ||
                res.user?.is_profile_complete ||
                (res.user?.gender &&
                  res.user?.region &&
                  (res.user?.birth_date || res.user?.age)),
              );

              navigate(isComplete ? "/" : "/complete-profile", {
                replace: true,
              });
            }
          } catch (err) {
            console.error("Google sync error:", err);
            toast.error("Google orqali kirishda xatolik");
          } finally {
            isProcessingGoogle.current = false;
          }
        }
      },
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate, loginWithToken]);

  // Google bilan kirish
  async function handleLoginGoogle() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) {
        toast.error("Google orqali kirishda xatolik: " + error.message);
        setLoading(false);
      }
    } catch (err) {
      toast.error("Xatolik yuz berdi");
      setLoading(false);
    }
  }

  // Telegram bosilganda eski Supabase OAuth sessiyasini tozalaymiz (TUZATILGAN QISMI)
  async function handleLoginTG() {
    setLoginType("telegram");
    // Eski Google sessiyasidan chiqib ketamiz, Telegramga xalaqit bermasligi uchun
    await supabase.auth.signOut();
  }

  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Telegram real-time tinglash
  function listenToAuthStatus(otp) {
    setStatusMessage("Botda '✅ Kirish' tugmasini bosishingiz kutilmoqda...");

    const channel = supabase
      .channel(`auth_${otp}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "telegram_auth_sessions",
          filter: `otp_code=eq.${otp}`,
        },
        async (payload) => {
          if (payload.new.status === "verified") {
            setStatusMessage("Tasdiqlandi! Tizimga kirilmoqda...");

            try {
              const data = await api.getTokenByOtp(otp);

              if (data.success && data.token) {
                loginWithToken(data.token, data.user);
                toast.success("Muvaffaqiyatli kirdingiz!");

                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current);
                  channelRef.current = null;
                }

                const isComplete = Boolean(
                  data.is_profile_complete ||
                  data.isProfileComplete ||
                  data.user?.is_profile_complete ||
                  (data.user?.gender &&
                    data.user?.region &&
                    (data.user?.birth_date || data.user?.age)),
                );

                navigate(isComplete ? "/" : "/complete-profile", {
                  replace: true,
                });
              } else {
                setStatusMessage(
                  data.error || "Token olishda xatolik yuz berdi",
                );
                setLoading(false);
              }
            } catch (err) {
              console.error("JWT fetch error:", err);
              setStatusMessage(
                "Server bilan bog'lanishda xatolik: " + err.message,
              );
              setLoading(false);
            }
          } else if (payload.new.status === "cancelled") {
            setStatusMessage("❌ Kirish bot orqali rad etildi.");
            toast.error("Kirish rad etildi");
            setLoading(false);
            if (channelRef.current) {
              supabase.removeChannel(channelRef.current);
              channelRef.current = null;
            }
          }
        },
      )
      .subscribe();

    channelRef.current = channel;
  }

  // Telegram botga o'tish
  async function loginTG() {
    setLoading(true);
    setStatusMessage("OTP kod yaratilmoqda...");

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    try {
      const otp = generateOTP();
      const tgWindow = window.open("", "_blank");

      const { error } = await supabase
        .from("telegram_auth_sessions")
        .insert([{ otp_code: otp, status: "pending" }]);

      if (error) {
        if (tgWindow) tgWindow.close();
        console.error("OTP saqlashda xatolik:", error);
        setStatusMessage("Xatolik yuz berdi. Qaytadan urinib ko'ring.");
        setLoading(false);
        return;
      }

      listenToAuthStatus(otp);

      if (tgWindow) {
        tgWindow.location.href = `https://t.me/Yaqinauthbot?start=${otp}`;
      } else {
        window.location.href = `https://t.me/Yaqinauthbot?start=${otp}`;
      }
    } catch (err) {
      console.error("loginTG Catch Error:", err);
      setStatusMessage("Kutilmagan xatolik.");
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <div className="app-brand-badge">
        <div className="brand-icon">
          <img src="/icon.png" alt="App Logo" />
        </div>
        <span className="brand-name">Yaqin</span>
      </div>

      {loginType === "default" && (
        <div className="fade-in-content">
          <h2>Yaqin ga xush kelibsiz!</h2>
          <p>
            O'zbekistondagi zamonaviy tanishuv va do'stlik ijtimoiy tarmog'i.
            Yangi insonlar bilan tanishing va qiziqarli lahzalaringizni
            ulashing!
          </p>

          <section className="login-card">
            <button onClick={handleLoginTG} className="login-btn-tg">
              <SiTelegram /> Telegram orqali tezkor kirish
            </button>

            <button
              onClick={handleLoginGoogle}
              className="login-btn-google"
              disabled={loading}
            >
              <FcGoogle /> Google hisobi orqali kirish
            </button>
          </section>

          <div className="login-footer-trust">
            <BsShieldCheck /> Ma'lumotlaringiz xavfsiz va maxfiy saqlanadi
          </div>
        </div>
      )}

      {loginType === "telegram" && (
        <section className="login-card fade-in-content">
          <button
            onClick={() => {
              setLoginType("default");
              setLoading(false);
              setStatusMessage("");
              if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
              }
            }}
            className="back-btn"
          >
            <IoArrowBackOutline />
          </button>
          <h2>Telegram orqali kirish</h2>
          <p>
            Pastdagi tugmani bosganingizda <b>@Yaqinauth</b> botiga o'tasiz va u
            yerda <b style={{ color: "#53fc7d" }}>"✅ Kirish"</b> tugmasi orqali
            hisobingizni tasdiqlaysiz.
          </p>

          {statusMessage && <p className="status-message">{statusMessage}</p>}

          {loading ? (
            <button disabled className="login-tg-btn btn-disabled">
              <BsRobot />
              Bot tasdiqlashi kutilmoqda...
            </button>
          ) : (
            <button onClick={loginTG} className="login-tg-btn">
              <BsRobot />
              Telegram botga o'tish
            </button>
          )}
        </section>
      )}
    </main>
  );
}

export default Login;
