"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Copy, Heart, Link2, LogOut, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function PairingScreen({ name }: { name: string }) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const client = createSupabaseBrowserClient();

  useEffect(() => {
    if (mode !== "create" || !client) return;
    const timer = window.setInterval(async () => {
      const { data } = await client.from("couple_members").select("couple_id").eq("user_id", (await client.auth.getUser()).data.user?.id || "").maybeSingle();
      if (!data?.couple_id) return;
      const { count } = await client.from("couple_members").select("user_id", { count: "exact", head: true }).eq("couple_id", data.couple_id);
      if ((count || 0) >= 2) { window.clearInterval(timer); router.refresh(); }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [mode, client, router]);

  const createInvite = async () => {
    if (!client) return; setBusy(true); setMessage("");
    const token = `NAMI-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const { data, error } = await client.rpc("create_couple_invite", { raw_token: token });
    if (error) setMessage(error.message); else { setCode(data?.[0]?.invite_code || token); setMode("create"); }
    setBusy(false);
  };
  const join = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!client) return; setBusy(true); setMessage("");
    const { error } = await client.rpc("accept_couple_invite", { raw_token: code.trim().toUpperCase() });
    if (error) setMessage(error.message.includes("invalid_or_expired") ? "این کد اشتباهه یا وقتش تموم شده." : error.message);
    else { router.refresh(); }
    setBusy(false);
  };
  const logout = async () => { await client?.auth.signOut(); router.push("/login"); router.refresh(); };

  return <main className="pairing-page"><section className="pairing-card">
    <div className="pairing-top"><div className="brand"><span className="brand-mark"><Heart size={21} fill="currentColor" /></span> نامی</div><button className="icon-button" aria-label="خروج" onClick={logout}><LogOut size={18} /></button></div>
    <div className="pairing-art"><UsersRound size={42} /></div><p className="eyebrow">سلام {name} 🫶</p><h1>آدمِت رو بیار توی نامی</h1><p className="muted">فضای دوتایی‌تون وقتی ساخته می‌شه که یکی دعوت کنه و اون یکی با کد وصل بشه.</p>
    {mode === "choose" && <div className="pairing-actions"><button className="primary-button" disabled={busy} onClick={createInvite}><Link2 size={18} /> {busy ? "دارم می‌سازم..." : "یه کد دعوت بساز"}</button><button className="secondary-button" onClick={() => setMode("join")}>کد دعوت دارم</button></div>}
    {mode === "create" && <div className="invite-result"><span>این کد رو فقط برای آدمِت بفرست</span><strong dir="ltr">{code}</strong><button className="primary-button" onClick={() => navigator.clipboard.writeText(code)}><Copy size={17} /> کپی کد</button><small>کد ۲۴ ساعت اعتبار داره. وقتی وصل شد، این صفحه خودکار کنار می‌ره.</small></div>}
    {mode === "join" && <form onSubmit={join} className="join-form"><label>کد دعوت</label><input className="input code-input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="NAMI-XXXXXXXX" dir="ltr" autoCapitalize="characters" required /><button className="primary-button" disabled={busy}>{busy ? "دارم وصل می‌کنم..." : "وصل شو به آدمِت 💜"}</button><button type="button" className="text-button" onClick={() => setMode("choose")}>برگرد</button></form>}
    {message && <div className="auth-message" role="alert">{message}</div>}
  </section></main>;
}
