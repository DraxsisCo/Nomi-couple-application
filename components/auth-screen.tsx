"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Heart, LockKeyhole, Mail, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup" | "reset";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setMessage("");
    const client = createSupabaseBrowserClient();
    if (!client) { setMessage("اتصال Supabase تنظیم نشده."); setBusy(false); return; }
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password") || "");
    const name = String(data.get("name") || "").trim();
    if (mode === "reset") {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/settings/password` });
      setMessage(error ? error.message : "لینک بازیابی رفت توی ایمیلت ✉️"); setBusy(false); return;
    }
    if (mode === "signup") {
      const { data: result, error } = await client.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: `${location.origin}/auth/callback` } });
      if (error) setMessage(error.message);
      else if (!result.session) setMessage("یه ایمیل تأیید برات فرستادیم؛ بعدش برگرد اینجا 💜");
      else { router.push("/"); router.refresh(); }
    } else {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message === "Invalid login credentials" ? "ایمیل یا رمزت درست نیست؛ یه بار دیگه چک کن." : error.message);
      else { router.push("/"); router.refresh(); }
    }
    setBusy(false);
  };

  return <main className="auth-page"><section className="auth-card">
    <div className="welcome-logo auth-logo"><Heart size={39} fill="currentColor" /></div>
    <p className="eyebrow">خوش اومدی به نامی 🫶</p>
    <h1>{mode === "login" ? "برگردیم پیش هم" : mode === "signup" ? "قصه‌تون از اینجا شروع می‌شه" : "رمزت یادت رفته؟"}</h1>
    <p className="muted">{mode === "reset" ? "ایمیلت رو بده تا لینک برگشت رو بفرستیم." : "فضای خصوصی خودتون؛ فقط تو و آدمِت."}</p>
    <form onSubmit={submit} className="auth-form">
      {mode === "signup" && <label className="auth-field"><span><UserRound size={17} /> اسمت</span><input className="input" name="name" autoComplete="name" required placeholder="دوست داری چی صدات کنیم؟" /></label>}
      <label className="auth-field"><span><Mail size={17} /> ایمیل</span><input className="input" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="you@example.com" dir="ltr" /></label>
      {mode !== "reset" && <label className="auth-field"><span><LockKeyhole size={17} /> رمز عبور</span><span className="password-field"><input className="input" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="حداقل ۸ کاراکتر" dir="ltr" /><button type="button" aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>{mode === "signup" && <small className="field-hint">حداقل ۸ کاراکتر؛ بهتره از یک رمز منحصربه‌فرد استفاده کنی.</small>}</label>}
      {message && <div className="auth-message" role="status">{message}</div>}
      <button className="primary-button" disabled={busy} aria-busy={busy}>{busy ? "یه لحظه..." : mode === "login" ? "ورود" : mode === "signup" ? "ساخت حساب" : "فرستادن لینک"}</button>
    </form>
    <div className="auth-actions">{mode === "login" ? <><button onClick={() => setMode("signup")}>هنوز حساب ندارم</button><button onClick={() => setMode("reset")}>رمزم یادم نیست</button></> : <button onClick={() => setMode("login")}>حساب دارم؛ برگرد به ورود</button>}</div>
  </section></main>;
}
