"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordPage() {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const router = useRouter();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); const password = String(new FormData(event.currentTarget).get("password"));
    const { error } = await createSupabaseBrowserClient()!.auth.updateUser({ password });
    if (error) setMessage(error.message); else { setMessage("رمز جدید ذخیره شد 💜"); window.setTimeout(() => router.push("/"), 900); }
    setBusy(false);
  };
  return <main className="auth-page"><section className="auth-card"><div className="pairing-art"><LockKeyhole size={36} /></div><p className="eyebrow">یه رمز تازه</p><h1>رمز جدیدت رو بساز</h1><form className="auth-form" onSubmit={submit}><label className="auth-field"><span><LockKeyhole size={17} /> رمز جدید</span><input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required dir="ltr" /></label>{message && <div className="auth-message">{message}</div>}<button className="primary-button" disabled={busy}>{busy ? "دارم ذخیره می‌کنم..." : "ذخیره رمز"}</button></form></section></main>;
}
