"use client";

import {
  Bell, BellRing, BookHeart, CalendarDays, Camera, ChevronLeft, ChevronRight, Clock3, Droplets,
  Check, Flame, Heart, Home, LockKeyhole, LogOut, Moon,
  Plus, Send, Settings, ShieldCheck, Sparkles, UsersRound, Waves,
  WifiOff, X,
} from "lucide-react";
import { Alert, BottomNavigation, BottomNavigationAction, Fab, Snackbar, SwipeableDrawer, Switch } from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { useRouter } from "next/navigation";
import gregorian from "react-date-object/calendars/gregorian";
import persian from "react-date-object/calendars/persian";
import gregorianEn from "react-date-object/locales/gregorian_en";
import persianFa from "react-date-object/locales/persian_fa";
import { createDefaultCycle, createDefaultIntimacy, ProductionScope, useNamiState } from "@/lib/use-nami-state";
import { dailyChallenge, dailyPrompt, pokeDetails, POKES } from "@/lib/fun-content";
import { registerPushSubscription } from "@/lib/push";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ACTIVITIES, ChallengeDeck, ChallengeState, CycleState, EventItem, IntimacyState, MemoryItem, MOODS, PokeKind, Tab } from "@/lib/types";

const fa = new Intl.NumberFormat("fa-IR");
const TEHRAN_TIME_ZONE = "Asia/Tehran";
const TEHRAN_OFFSET = "+03:30";
const persianDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", timeZone: TEHRAN_TIME_ZONE });

function tehranToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TEHRAN_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(get("year"), get("month") - 1, get("day"), 12);
}

function tehranIsoDateTime(date: string, time: string) {
  return new Date(`${date}T${time || "00:00"}:00${TEHRAN_OFFSET}`).toISOString();
}

function localIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function jalaliPickerValue(isoDate: string) {
  return new DateObject({ date: isoDate, format: "YYYY-MM-DD", calendar: gregorian }).convert(persian, persianFa);
}

function selectedIsoDate(value: DateObject | DateObject[] | null) {
  if (!(value instanceof DateObject) || !value.isValid) return null;
  return new DateObject(value).convert(gregorian, gregorianEn).format("YYYY-MM-DD");
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function cycleInfo(cycle: CycleState) {
  const start = parseLocalDate(cycle.lastPeriodStart);
  const today = tehranToday();
  const elapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const cycleDay = (elapsed % cycle.cycleLength) + 1;
  const daysToNext = cycle.cycleLength - cycleDay + 1;
  const nextPeriod = addDays(today, daysToNext);
  const ovulationDay = Math.max(cycle.periodLength + 2, cycle.cycleLength - 14);
  const fertileStartDay = ovulationDay - 4;
  const fertileEndDay = ovulationDay + 1;
  const phase = cycleDay <= cycle.periodLength
    ? { title: "روزهای پریود", detail: "استراحت و مراقبت بیشتر می‌تونه کمک‌کننده باشه", tone: "period" }
    : cycleDay >= fertileStartDay && cycleDay <= fertileEndDay
      ? { title: "پنجره‌ی باروری", detail: "این بازه فقط یک تخمین بر اساس طول چرخه است", tone: "fertile" }
      : cycleDay < fertileStartDay
        ? { title: "فاز فولیکولار", detail: "انرژی بدن معمولاً به‌تدریج بیشتر می‌شه", tone: "follicular" }
        : { title: "فاز لوتئال", detail: "ممکنه تغییرات خلقی یا انرژی رو تجربه کنی", tone: "luteal" };
  const currentCycleStart = addDays(today, -(cycleDay - 1));
  const fertileCycleOffset = cycleDay > fertileEndDay ? cycle.cycleLength : 0;
  return {
    cycleDay,
    daysToNext,
    nextPeriod,
    fertileStart: addDays(currentCycleStart, fertileStartDay - 1 + fertileCycleOffset),
    fertileEnd: addDays(currentCycleStart, fertileEndDay - 1 + fertileCycleOffset),
    phase,
  };
}

function useSignalActive(intimacy: IntimacyState) {
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    const syncTimer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    if (!intimacy.expiresAt) return () => window.clearTimeout(syncTimer);
    const remaining = new Date(intimacy.expiresAt).getTime() - Date.now();
    const expiryTimer = remaining > 0 ? window.setTimeout(() => setCurrentTime(Date.now()), remaining + 20) : undefined;
    return () => { window.clearTimeout(syncTimer); if (expiryTimer) window.clearTimeout(expiryTimer); };
  }, [intimacy.expiresAt]);
  return Boolean(intimacy.signal && (!intimacy.expiresAt || currentTime === 0 || new Date(intimacy.expiresAt).getTime() > currentTime));
}
const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "خانه", icon: Home },
  { id: "calendar", label: "تقویم", icon: CalendarDays },
  { id: "cycle", label: "چرخه", icon: Droplets },
  { id: "diary", label: "خاطره‌ها", icon: BookHeart },
  { id: "settings", label: "تنظیمات", icon: Settings },
];

export function CouplesApp({ production }: { production: ProductionScope }) {
  const { state, update, updateProfile, answerDaily, reactToDaily, sendPoke, markPokesSeen, setChallengeState, setAdultFun, ready, error, reload } = useNamiState(production);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [modal, setModal] = useState<"status" | "event" | "cycle" | "intimacy" | "memory" | "relationship" | "invite" | "profile" | "daily" | "poke" | "challenge" | null>(null);
  const [toast, setToast] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const [online, setOnline] = useState(true);
  const cycleDraft = state.cycle ?? createDefaultCycle();
  const intimacy = state.intimacy ?? createDefaultIntimacy();

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const sync = () => setOnline(navigator.onLine);
    sync(); window.addEventListener("online", sync); window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (ready && state.notifications && typeof Notification !== "undefined" && Notification.permission === "granted") void registerPushSubscription(production.userId).catch((pushError) => console.error("[Nami] push registration", pushError));
  }, [ready, state.notifications, production.userId]);

  const persist = async (action: () => Promise<void>, success: string, close = true) => {
    try {
      await action();
      if (close) setModal(null);
      setToast({ message: success, severity: "success" });
    } catch (saveError) {
      setToast({ message: saveError instanceof Error ? saveError.message : "ذخیره انجام نشد؛ دوباره امتحان کن.", severity: "error" });
    }
  };

  if (!ready) return <main className="welcome"><section className="welcome-card"><div className="welcome-logo"><Heart size={42} fill="currentColor" /></div><p className="muted">داریم فضای دوتایی‌تون رو میاریم…</p></section></main>;

  const openAdd = () => setModal(tab === "calendar" ? "event" : tab === "cycle" ? "cycle" : tab === "diary" ? "memory" : "status");
  const addLabel = tab === "calendar" ? "افزودن قرار" : tab === "cycle" ? "ثبت وضعیت چرخه" : tab === "diary" ? "ثبت خاطره" : "به‌روزرسانی حال";

  return (
    <main className="app-shell">
      <Snackbar open={Boolean(toast)} autoHideDuration={3200} onClose={() => setToast(null)} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert icon={false} variant="filled" severity={toast?.severity ?? "success"} onClose={() => setToast(null)}>{toast?.message}</Alert>
      </Snackbar>
      {!online && <div className="toast"><WifiOff size={15} /> اینترنت قطع شده؛ تا وصل شدن دوباره چیزی ذخیره نمی‌شه</div>}
      <div className="page">
        <Header viewerName={state.viewerName} partnerName={state.partnerName} viewerAvatarUrl={state.viewerAvatarUrl} partnerAvatarUrl={state.partnerAvatarUrl} onInvite={() => setModal("invite")} />
        {error && <Alert severity="error" action={<button className="text-button" onClick={() => void reload()}>تلاش دوباره</button>} sx={{ mb: 2 }}>{error}</Alert>}
        <div className="view-enter" key={tab}>
        {tab === "home" && <HomeView state={state} userId={production.userId} coupleId={production.coupleId} intimacy={intimacy} partnerIntimacy={state.partnerIntimacy} viewerName={state.viewerName} partnerName={state.partnerName} openStatus={() => setModal("status")} openIntimacy={() => setModal("intimacy")} openDaily={() => setModal("daily")} openPoke={() => { setModal("poke"); void markPokesSeen(); }} openChallenge={() => setModal("challenge")} goTo={setTab} />}
        {tab === "calendar" && <CalendarView events={state.events} />}
        {tab === "cycle" && <CycleView cycle={state.cycle} partnerName={state.partnerName} onLog={() => setModal("cycle")} onShare={() => state.cycle && void persist(() => update({ cycle: { ...state.cycle!, sharedWithPartner: !state.cycle!.sharedWithPartner } }), state.cycle.sharedWithPartner ? "چرخه خصوصی شد" : `چرخه با ${state.partnerName} به اشتراک گذاشته شد`, false)} />}
        {tab === "diary" && <DiaryView memories={state.memories} />}
        {tab === "settings" && (
          <SettingsView
            viewerName={state.viewerName}
            partnerName={state.partnerName}
            viewerAvatarUrl={state.viewerAvatarUrl}
            relationshipStartedOn={state.relationshipStartedOn}
            notifications={state.notifications}
            quietHours={state.quietHours}
            onNotifications={async () => {
              if (!state.notifications && "Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") { setToast({ message: "اجازه‌ی اعلان داده نشد؛ هر وقت خواستی از تنظیمات مرورگر فعالش کن", severity: "error" }); return; }
              }
              await persist(async () => { if (!state.notifications) await registerPushSubscription(production.userId); await update({ notifications: !state.notifications }); }, !state.notifications ? "اعلان‌ها فعال شدند" : "اعلان‌ها خاموش شدند", false);
            }}
            onQuiet={() => void persist(() => update({ quietHours: !state.quietHours }), !state.quietHours ? "ساعت آرامش فعال شد" : "ساعت آرامش خاموش شد", false)}
            onRelationship={() => setModal("relationship")}
            onProfile={() => setModal("profile")}
            onSpace={() => setModal("invite")}
            onReset={async () => { await createSupabaseBrowserClient()?.auth.signOut(); router.push("/login"); router.refresh(); }}
          />
        )}
        </div>
      </div>

      {tab !== "settings" && <Fab className="fab" color="primary" aria-label={addLabel} title={addLabel} onClick={openAdd}><Plus /></Fab>}
      <BottomNavigation className="bottom-nav" component="nav" aria-label="ناوبری اصلی" showLabels value={tab} onChange={(_event, nextTab: Tab) => setTab(nextTab)}>
        {navItems.map(({ id, label, icon: Icon }) => (
          <BottomNavigationAction key={id} value={id} label={label} aria-current={tab === id ? "page" : undefined} icon={<Icon size={21} strokeWidth={tab === id ? 2.7 : 2} />} />
        ))}
      </BottomNavigation>

      {modal === "status" && (
        <StatusSheet
          currentMood={state.mood}
          currentActivity={state.activity ?? ACTIVITIES[0]}
          partnerName={state.partnerName}
          onClose={() => setModal(null)}
          onSave={(mood, activity) => void persist(() => update({ mood, activity }), `مودت برای ${state.partnerName} آپدیت شد 💜`)}
        />
      )}
      {modal === "event" && (
        <EventSheet onClose={() => setModal(null)} onSave={(event) => void persist(() => update({ events: [event, ...state.events] }), "قرار جدید به تقویم دونفره اضافه شد")} />
      )}
      {modal === "cycle" && <CycleSheet cycle={cycleDraft} partnerName={state.partnerName} onClose={() => setModal(null)} onSave={(nextCycle) => void persist(() => update({ cycle: nextCycle }), "وضعیت چرخه ثبت شد")} />}
      {modal === "intimacy" && <IntimacySheet intimacy={intimacy} partnerName={state.partnerName} onClose={() => setModal(null)} onSave={(nextIntimacy) => void persist(() => update({ intimacy: nextIntimacy }), nextIntimacy.signal ? `سیگنالت رفت برای ${state.partnerName} 😏` : "سیگنال برداشته شد، اوکیه 🤍")} />}
      {modal === "memory" && (
        <MemorySheet viewerId={production.userId} viewerName={state.viewerName} onClose={() => setModal(null)} onSave={(memory) => void persist(() => update({ memories: [memory, ...state.memories] }), "خاطره‌تون ثبت شد 🤍")} />
      )}
      {modal === "relationship" && <RelationshipSheet value={state.relationshipStartedOn} onClose={() => setModal(null)} onSave={(relationshipStartedOn) => void persist(() => update({ relationshipStartedOn }), "تاریخ شروع قصه‌تون ذخیره شد")} />}
      {modal === "invite" && <InviteSheet viewerName={state.viewerName} partnerName={state.partnerName} onClose={() => setModal(null)} />}
      {modal === "profile" && <ProfileSheet name={state.viewerName} avatarUrl={state.viewerAvatarUrl} onClose={() => setModal(null)} onSave={(name, avatar) => void persist(() => updateProfile(name, avatar), "پروفایلت آپدیت شد ✨")} />}
      {modal === "daily" && <DailyQuestionSheet state={state} userId={production.userId} coupleId={production.coupleId} partnerName={state.partnerName} onClose={() => setModal(null)} onSave={(promptKey, answer) => void persist(() => answerDaily(promptKey, answer), "جوابت ثبت شد؛ حالا نوبت دوتون کامل شه ✨", false)} onReact={(reaction) => void persist(() => reactToDaily(reaction), "ری‌اکشنت ثبت شد", false)} />}
      {modal === "poke" && <PokeSheet partnerName={state.partnerName} onClose={() => setModal(null)} onSend={(kind, message) => void persist(() => sendPoke(kind, message), `تلنگرت رفت برای ${state.partnerName} 💜`)} />}
      {modal === "challenge" && <ChallengeSheet state={state} userId={production.userId} coupleId={production.coupleId} partnerName={state.partnerName} onClose={() => setModal(null)} onState={(key, deck, nextState) => void persist(() => setChallengeState(key, deck, nextState), "چالش‌تون آپدیت شد", false)} onAdultToggle={(enabled) => void persist(() => setAdultFun(enabled), enabled ? "درخواست After Dark ثبت شد 🔒" : "After Dark خاموش شد", false)} />}
    </main>
  );
}

function PersonAvatar({ name, url, className = "" }: { name: string; url?: string | null; className?: string }) {
  return <span className={`avatar ${className}`} style={url ? { backgroundImage: `url(${JSON.stringify(url)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{url ? <span className="sr-only">{name}</span> : name.slice(0, 1)}</span>;
}

function Header({ viewerName, partnerName, viewerAvatarUrl, partnerAvatarUrl, onInvite }: { viewerName: string; partnerName: string; viewerAvatarUrl: string | null; partnerAvatarUrl: string | null; onInvite: () => void }) {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Heart size={21} fill="currentColor" /></span> نامی</div>
      <button className="avatar-pair" aria-label="اطلاعات زوج" onClick={onInvite} style={{ border: 0, background: "transparent", padding: 0 }}>
        <PersonAvatar name={viewerName} url={viewerAvatarUrl} /><span className="partner-avatar-wrap"><PersonAvatar name={partnerName} url={partnerAvatarUrl} className="partner-avatar" /><span className="online-dot" /></span>
      </button>
    </header>
  );
}

function relationshipDays(startedOn: string) {
  const start = parseLocalDate(startedOn);
  return Math.max(1, Math.floor((tehranToday().getTime() - start.getTime()) / 86400000) + 1);
}

function HomeView({ state, userId, coupleId, intimacy, partnerIntimacy, viewerName, partnerName, openStatus, openIntimacy, openDaily, openPoke, openChallenge, goTo }: { state: ReturnType<typeof useNamiState>["state"]; userId: string; coupleId: string; intimacy: IntimacyState; partnerIntimacy: IntimacyState | null; viewerName: string; partnerName: string; openStatus: () => void; openIntimacy: () => void; openDaily: () => void; openPoke: () => void; openChallenge: () => void; goTo: (tab: Tab) => void }) {
  const next = state.events[0];
  const visibleIntimacy = partnerIntimacy ?? intimacy;
  const intimacyOwner = partnerIntimacy ? partnerName : viewerName;
  return <>
    <div className="greeting-row"><div><p className="eyebrow">هی {viewerName} 🫶</p><h1>امروز دلت چه مودیه؟</h1></div><span className="date-chip">امروز</span></div>
    <section className="card hero-card">
      <div className="hero-title"><div><span className="muted">از روزی که «ما» شدین</span><div className="together-days">{fa.format(relationshipDays(state.relationshipStartedOn))} روز</div><span className="muted">پر از ویـب خوب و خاطره ✨</span></div><div className="heart-orbit"><Heart size={31} fill="currentColor" /></div></div>
    </section>

    <div className="section-head"><h2>مود دوتامون</h2><button className="text-button" onClick={openStatus}>مودمو عوض کن</button></div>
    <section className="status-grid">
      <div className="card status-card">
        <div className="status-person"><PersonAvatar name={viewerName} url={state.viewerAvatarUrl} /><div><strong>تو</strong><small>وضعیت خودت</small></div></div>
        <div className="mood-bubble"><span className="mood-emoji">{state.mood?.emoji ?? "✨"}</span><strong>{state.mood?.label ?? "هنوز ثبت نشده"}</strong></div>
        <div className="activity"><Clock3 size={13} /> {state.activity ?? "مودت رو برای اولین بار ثبت کن"}</div>
      </div>
      <div className="card status-card">
        <div className="status-person"><PersonAvatar name={partnerName} url={state.partnerAvatarUrl} className="rose-avatar" /><div><strong>{partnerName}</strong><small>آخرین وضعیت</small></div></div>
        <div className="mood-bubble" style={{ background: "var(--rose-soft)" }}><span className="mood-emoji">{state.partnerMood?.emoji ?? "🤍"}</span><strong>{state.partnerMood?.label ?? "هنوز ثبت نشده"}</strong></div>
        <div className="activity"><Clock3 size={13} /> {state.partnerActivity ?? `منتظر اولین آپدیت ${partnerName}`}</div>
      </div>
    </section>

    <DailySpark state={state} userId={userId} coupleId={coupleId} partnerName={partnerName} openDaily={openDaily} openPoke={openPoke} openChallenge={openChallenge} />
    <button className="update-card" onClick={openStatus}><span>مودت عوض شد؟ به {partnerName} یه سیگنال بده</span><ChevronLeft size={20} /></button>

    <IntimacyCard intimacy={visibleIntimacy} ownerName={intimacyOwner} isPartnerSignal={Boolean(partnerIntimacy)} onOpen={openIntimacy} />

    <div className="section-head"><h2>پلن بعدیمون</h2><button className="text-button" onClick={() => goTo("calendar")}>همه پلن‌ها</button></div>
    {next ? <EventCard event={next} /> : <button className="card memory-preview" onClick={() => goTo("calendar")} style={{ width: "100%", textAlign: "right", color: "inherit" }}><div className="memory-art">📅</div><div><h3>هنوز پلنی ندارین</h3><p>اولین قرار یا مناسبت دوتایی‌تون رو ثبت کنین.</p></div></button>}

    <div className="section-head"><h2>آخرین خاطره‌بازی</h2><button className="text-button" onClick={() => goTo("diary")}>آلبوم ما</button></div>
    <button className="card memory-preview" onClick={() => goTo("diary")} style={{ width: "100%", textAlign: "right", color: "inherit" }}>
      <div className="memory-art">{state.memories[0]?.emoji || "🤍"}</div><div><h3>{state.memories[0]?.title || "اولین خاطره‌تون رو بسازین"}</h3><span className="eyebrow">{state.memories[0]?.date}</span><p>{state.memories[0]?.body}</p></div>
    </button>
  </>;
}

function IntimacyCard({ intimacy, ownerName, isPartnerSignal, onOpen }: { intimacy: IntimacyState; ownerName: string; isPartnerSignal: boolean; onOpen: () => void }) {
  const isActive = useSignalActive(intimacy);
  return <section className="intimacy-card">
    <div className="intimacy-card-copy"><span className="intimacy-icon"><Flame size={21} fill="currentColor" /></span><div><span className="intimacy-kicker">فقط بین خودتون 🔒</span><h3>{isActive ? `${intimacy.emoji} مود ${ownerName}: ${intimacy.signal}` : "امشب چه ویبی داری؟"}</h3><p>{isActive ? (intimacy.message || (isPartnerSignal ? `${ownerName} یه سیگنال برات فرستاده` : `${ownerName} سیگنالت رو می‌بینه`)) : "فلرت، بغل یا یه مود هات؟ بدون فشار، فقط یه سیگنال کوچیک."}</p></div></div>
    <button onClick={onOpen}>{isActive && !isPartnerSignal ? "عوضش کن" : "جواب بده 😏"}<ChevronLeft size={18} /></button>
  </section>;
}

function EventCard({ event }: { event: EventItem }) {
  return <div className="card event-card"><div className="date-box"><strong>{fa.format(event.day)}</strong><small>{event.month}</small></div><div><h3>{event.title}</h3><p><Clock3 size={12} style={{ verticalAlign: "middle" }} /> {event.time} · تهران</p></div><div className="countdown"><strong>{fa.format(event.daysLeft)}</strong>روز دیگه</div></div>;
}

function CalendarView({ events }: { events: EventItem[] }) {
  const [month, setMonth] = useState(() => new DateObject({ date: new Date(), calendar: gregorian, locale: persianFa }).convert(persian));
  const visibleEvents = events.filter((event) => {
    if (!event.startsAt) return false;
    const eventDate = new DateObject({ date: new Date(event.startsAt), calendar: gregorian }).convert(persian, persianFa);
    return eventDate.year === month.year && eventDate.month.number === month.month.number;
  });
  const moveMonth = (amount: number) => setMonth(new DateObject(month).add(amount, "month"));
  return <>
    <p className="eyebrow">پلن‌هامون، یه‌جا ✨</p><h1>تقویم دوتایی</h1>
    <section className="card calendar">
      <div className="calendar-head"><div><h2 style={{ margin: 0 }}>{month.month.name} {fa.format(month.year)}</h2><span className="muted" style={{ fontSize: 12 }}>{fa.format(visibleEvents.length)} پلن در این ماه</span></div><div className="month-switch"><button className="icon-button" aria-label="ماه قبل" onClick={() => moveMonth(-1)}><ChevronRight size={19} /></button><button className="icon-button" aria-label="ماه بعد" onClick={() => moveMonth(1)}><ChevronLeft size={19} /></button></div></div>
      <p className="muted" style={{ margin: "18px 0 0" }}>همه‌ی تاریخ‌ها شمسی و ساعت‌ها به وقت تهران نمایش داده می‌شن.</p>
    </section>
    <div className="section-head"><h2>قرارهای {month.month.name}</h2><span className="muted">{fa.format(visibleEvents.length)} قرار</span></div>
    <div className="event-list">{visibleEvents.map((event) => <div className="event-row" key={event.id}><span className="event-dot" /><div><strong>{event.title}</strong><p>{fa.format(event.day)} {event.month} · {event.time} تهران</p><small className="muted">یادآوری: {event.reminder}</small></div></div>)}{visibleEvents.length === 0 && <div className="empty-state"><CalendarDays size={28} /><strong>این ماه هنوز قراری ندارین</strong><span>با دکمه‌ی + یک وقت دونفره بسازین.</span></div>}</div>
  </>;
}

function DailySpark({ state, userId, coupleId, partnerName, openDaily, openPoke, openChallenge }: { state: ReturnType<typeof useNamiState>["state"]; userId: string; coupleId: string; partnerName: string; openDaily: () => void; openPoke: () => void; openChallenge: () => void }) {
  const today = localIsoDate(tehranToday());
  const prompt = dailyPrompt(coupleId, today);
  const challenge = dailyChallenge(coupleId, today);
  const ownAnswer = state.dailyAnswers.find((answer) => answer.userId === userId);
  const bothAnswered = state.dailyAnswers.length === 2;
  const incoming = state.pokes.find((poke) => poke.senderId !== userId);
  const unread = state.pokes.filter((poke) => poke.senderId !== userId && !poke.seenAt).length;
  const ownChallenge = state.challengeResponses.find((response) => response.userId === userId && response.challengeKey === challenge.id);
  const partnerChallenge = state.challengeResponses.find((response) => response.userId !== userId && response.challengeKey === challenge.id);
  const complete = ownChallenge?.state === "completed" && partnerChallenge?.state === "completed";
  return <section className="daily-spark">
    <div className="section-head"><div><span className="spark-kicker">جرقه‌ی امروز</span><h2>یه کم فان برای دوتاتون</h2></div><span className="spark-badge"><Sparkles size={14} /> روزانه</span></div>
    <button className="spark-card question-card" onClick={openDaily}>
      <span className="spark-emoji">{prompt.emoji}</span><span><small>سؤال امروز</small><strong>{prompt.text}</strong><em>{bothAnswered ? "جواب‌ها باز شدن؛ بزن ببین 👀" : ownAnswer ? `جوابت امنه؛ منتظر ${partnerName} هستیم` : "اول جواب بده؛ جواب همدیگه باهم باز می‌شه"}</em></span><ChevronLeft size={20} />
    </button>
    <div className="spark-grid">
      <button className="spark-mini poke-card" onClick={openPoke}><span>{incoming ? pokeDetails(incoming.kind).emoji : "💌"}{unread > 0 && <b>{fa.format(unread)}</b>}</span><strong>{incoming ? `${partnerName} یه تلنگر زده` : "یه تلنگر بفرست"}</strong><small>{incoming?.message || "یه بغل، بوس یا یادتم"}</small></button>
      <button className={`spark-mini challenge-card ${complete ? "complete" : ""}`} onClick={openChallenge}><span>{complete ? "🏆" : challenge.emoji}</span><strong>{complete ? "چالش تموم شد!" : "چالش کوچولو"}</strong><small>{complete ? "تیم خفنی هستین" : challenge.text}</small></button>
    </div>
  </section>;
}

function CycleView({ cycle, partnerName, onLog, onShare }: { cycle: CycleState | null; partnerName: string; onLog: () => void; onShare: () => void }) {
  if (!cycle) return <>
    <div className="cycle-heading"><div><p className="eyebrow">شناخت بهتر بدن</p><h1>چرخه‌ی من</h1></div></div>
    <section className="card empty-state" style={{ padding: 32 }}><Droplets size={34} /><strong>هنوز چرخه‌ای ثبت نشده</strong><span>با ثبت تاریخ آخرین پریود، تخمین‌های شخصی خودت ساخته می‌شن.</span><button className="primary-button" onClick={onLog}>ثبت اولین چرخه</button></section>
    <div className="cycle-disclaimer"><ShieldCheck size={18} /><p>تاریخ‌ها تخمینی‌اند و برای پیشگیری از بارداری یا تشخیص پزشکی مناسب نیستند.</p></div>
  </>;
  const info = cycleInfo(cycle);
  const progress = Math.min(100, Math.round((info.cycleDay / cycle.cycleLength) * 100));
  const nextSeven = Array.from({ length: 7 }, (_, index) => addDays(tehranToday(), index));
  return <>
    <div className="cycle-heading">
      <div><p className="eyebrow">شناخت بهتر بدن</p><h1>چرخه‌ی من</h1></div>
      <button className="privacy-chip" onClick={onShare} aria-pressed={cycle.sharedWithPartner}>
        {cycle.sharedWithPartner ? <UsersRound size={15} /> : <LockKeyhole size={15} />}
        {cycle.sharedWithPartner ? `مشترک با ${partnerName}` : "فقط برای من"}
      </button>
    </div>

    <section className={`card cycle-hero ${info.phase.tone}`}>
      <div className="cycle-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
        <div><span>روز</span><strong>{fa.format(info.cycleDay)}</strong><small>از {fa.format(cycle.cycleLength)}</small></div>
      </div>
      <div className="cycle-summary"><span className="cycle-phase"><Waves size={16} /> {info.phase.title}</span><h2>{fa.format(info.daysToNext)} روز تا پریود بعدی</h2><p>{info.phase.detail}</p><span className="estimate-date">تخمین شروع: {persianDate.format(info.nextPeriod)}</span></div>
    </section>

    <button className="primary-button cycle-log-button" onClick={onLog}><Plus size={19} /> ثبت وضعیت امروز</button>

    <div className="section-head"><h2>هفته‌ی پیش رو</h2><span className="muted">امروز تا ۷ روز</span></div>
    <section className="card week-strip">
      {nextSeven.map((date, index) => {
        const projectedDay = ((info.cycleDay - 1 + index) % cycle.cycleLength) + 1;
        const isPeriod = projectedDay <= cycle.periodLength;
        const isFertile = projectedDay >= cycle.cycleLength - 18 && projectedDay <= cycle.cycleLength - 13;
        return <div className={`cycle-day ${index === 0 ? "active" : ""}`} key={date.toISOString()}><span>{new Intl.DateTimeFormat("fa-IR", { weekday: "short", timeZone: TEHRAN_TIME_ZONE }).format(date)}</span><strong>{new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", timeZone: TEHRAN_TIME_ZONE }).format(date)}</strong><i className={isPeriod ? "period-dot" : isFertile ? "fertile-dot" : ""} /></div>;
      })}
      <div className="cycle-legend"><span><i className="period-dot" /> پریود</span><span><i className="fertile-dot" /> باروری تخمینی</span></div>
    </section>

    <div className="cycle-info-grid">
      <section className="card insight-card"><span className="insight-icon rose"><Droplets size={21} /></span><div><small>پریود بعدی</small><strong>{persianDate.format(info.nextPeriod)}</strong><span>{fa.format(cycle.periodLength)} روز تخمینی</span></div></section>
      <section className="card insight-card"><span className="insight-icon mint"><Sparkles size={21} /></span><div><small>پنجره‌ی باروری</small><strong>{persianDate.format(info.fertileStart)}</strong><span>تا {persianDate.format(info.fertileEnd)}</span></div></section>
    </div>

    {cycle.symptoms.length > 0 && <><div className="section-head"><h2>حال امروز</h2><button className="text-button" onClick={onLog}>ویرایش</button></div><section className="card symptom-card"><div className="symptom-list">{cycle.symptoms.map((symptom) => <span key={symptom}>{symptom}</span>)}</div>{cycle.note && <p>{cycle.note}</p>}</section></>}

    <div className="cycle-disclaimer"><ShieldCheck size={18} /><p>تاریخ‌ها تخمینی‌اند و برای پیشگیری از بارداری یا تشخیص پزشکی مناسب نیستند.</p></div>
  </>;
}

function DiaryView({ memories }: { memories: MemoryItem[] }) {
  return <>
    <p className="eyebrow">آرشیوِ «یادته؟»‌هامون</p><h1>خاطره‌بازی</h1><p className="muted">از دیت‌های خفن تا لحظه‌های کوچیکی که دلمون نمیاد یادمون بره.</p>
    <div className="timeline">{memories.map((memory, index) => <article className="card memory-card" key={memory.id}><div className={`memory-photo ${index % 2 ? "alt" : ""}`}>{memory.emoji}</div><div className="memory-content"><div className="memory-meta"><span>{memory.date}</span><span>نوشته‌ی {memory.authorName}</span></div><h2 style={{ margin: "10px 0 0" }}>{memory.title}</h2><p>{memory.body}</p>{memory.reply && <div className="reply"><span className="avatar">{memory.replyAuthorName?.slice(0, 1)}</span><span><strong>{memory.replyAuthorName}</strong><br />{memory.reply}</span></div>}</div></article>)}{memories.length === 0 && <div className="empty-state"><BookHeart size={30} /><strong>دفترتون هنوز سفیده</strong><span>با دکمه‌ی + اولین خاطره‌ی واقعی‌تون رو ثبت کنین.</span></div>}</div>
  </>;
}

function SettingsView({ viewerName, partnerName, viewerAvatarUrl, relationshipStartedOn, notifications, quietHours, onNotifications, onQuiet, onRelationship, onProfile, onSpace, onReset }: { viewerName: string; partnerName: string; viewerAvatarUrl: string | null; relationshipStartedOn: string; notifications: boolean; quietHours: boolean; onNotifications: () => void; onQuiet: () => void; onRelationship: () => void; onProfile: () => void; onSpace: () => void; onReset: () => void }) {
  const relationshipDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "long", timeZone: TEHRAN_TIME_ZONE }).format(new Date(`${relationshipStartedOn}T12:00:00${TEHRAN_OFFSET}`));
  return <>
    <p className="eyebrow">همه‌چی همون‌جوری که تو می‌خوای</p><h1>تنظیماتِ خودمونی</h1>
    <button className="card profile-summary" onClick={onProfile}><PersonAvatar name={viewerName} url={viewerAvatarUrl} className="profile-summary-avatar" /><div><h2>{viewerName}</h2><span className="muted">همراه {partnerName} از {relationshipDate}</span><small>برای تغییر اسم یا عکس بزن اینجا</small></div><ChevronLeft size={20} /></button>
    <div className="settings-list">
      <Setting icon={BellRing} title="اعلان‌های نامی" subtitle="اعلان‌های مرورگر هنگام باز بودن نامی" action={<Switch checked={notifications} onChange={onNotifications} slotProps={{ input: { "aria-label": "تغییر اعلان‌ها" } }} />} />
      <Setting icon={Moon} title="ساعت آرامش" subtitle="از ۲۳ شب تا ۸ صبح" action={<Switch checked={quietHours} onChange={onQuiet} slotProps={{ input: { "aria-label": "تغییر ساعت آرامش" } }} />} />
      <button className="setting-row" onClick={onRelationship}><span className="setting-icon"><Heart size={20} /></span><div><strong>شروع قصه‌مون</strong><p>{relationshipDate}</p></div><ChevronLeft size={20} /></button>
      <button className="setting-row" onClick={onSpace}><span className="setting-icon"><UsersRound size={20} /></span><div><strong>فضای دونفره</strong><p>{viewerName} و {partnerName} · اتصال فعال</p></div><ChevronLeft size={20} /></button>
      <button className="setting-row" onClick={onReset}><span className="setting-icon" style={{ color: "#b65059", background: "var(--rose-soft)" }}><LogOut size={20} /></span><div><strong>خروج از حساب</strong><p>بازگشت به صفحه‌ی ورود</p></div><ChevronLeft size={20} /></button>
    </div>
    <p className="muted" style={{ textAlign: "center", fontSize: 11, marginTop: 24 }}>نامی نسخه ۰.۱ · ساخته شده برای شما دوتا 🤍</p>
  </>;
}

function Setting({ icon: Icon, title, subtitle, action }: { icon: typeof Bell; title: string; subtitle: string; action: React.ReactNode }) {
  return <div className="setting-row"><span className="setting-icon"><Icon size={20} /></span><div><strong>{title}</strong><p>{subtitle}</p></div>{action}</div>;
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <SwipeableDrawer anchor="bottom" open onClose={onClose} onOpen={() => undefined} disableDiscovery swipeAreaWidth={0} sx={{ "& .MuiDrawer-paper": { width: "min(100%, 620px)", maxHeight: "92dvh", marginInline: "auto", borderRadius: "30px 30px 0 0", overflow: "auto", backgroundImage: "none" } }}><section className="sheet" role="dialog" aria-modal="true"><div className="sheet-handle" /><button className="icon-button" aria-label="بستن" onClick={onClose} style={{ position: "absolute", left: 18, top: 18 }}><X size={18} /></button>{children}</section></SwipeableDrawer>;
}

function StatusSheet({ currentMood, currentActivity, partnerName, onClose, onSave }: { currentMood: { emoji: string; label: string } | null; currentActivity: string; partnerName: string; onClose: () => void; onSave: (m: { emoji: string; label: string }, a: string) => void }) {
  const [mood, setMood] = useState<{ emoji: string; label: string }>(currentMood ?? MOODS[0]); const [activity, setActivity] = useState(currentActivity);
  return <Sheet onClose={onClose}><p className="eyebrow">یه آپدیت کوچولو برای {partnerName}</p><h2>الان چه مود و فازی داری؟</h2><div className="choice-grid">{MOODS.map((m) => <button key={m.label} className={`choice ${m.label === mood.label ? "selected" : ""}`} onClick={() => setMood(m)}><span>{m.emoji}</span>{m.label}</button>)}</div><div className="field"><label>الان درگیر چی‌ای؟</label><select className="input" value={activity} onChange={(e) => setActivity(e.target.value)}>{ACTIVITIES.map((a) => <option key={a}>{a}</option>)}</select></div><button className="primary-button" onClick={() => onSave(mood, activity)}>مودمو بفرست ✨</button></Sheet>;
}

function EventSheet({ onClose, onSave }: { onClose: () => void; onSave: (e: EventItem) => void }) {
  const [eventDate, setEventDate] = useState(localIsoDate(tehranToday()));
  const [eventTime, setEventTime] = useState("19:00");
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const selected = jalaliPickerValue(eventDate);
    const targetDate = parseLocalDate(eventDate);
    const daysLeft = Math.max(0, Math.ceil((targetDate.getTime() - tehranToday().getTime()) / 86400000));
    onSave({
      id: crypto.randomUUID(),
      title: String(data.get("title")),
      day: selected.day,
      month: selected.month.name,
      time: eventTime || "تمام روز",
      daysLeft,
      reminder: String(data.get("reminder")),
      startsAt: tehranIsoDateTime(eventDate, eventTime),
    });
  };
  return <Sheet onClose={onClose}><p className="eyebrow">یه تایم خوب برای دوتاتون</p><h2>پلن تازه ✨</h2><form onSubmit={submit}><div className="field"><label>اسم پلن</label><input className="input" name="title" required placeholder="مثلاً شام دونفره" /></div><div className="field"><label>تاریخ شمسی</label><DatePicker value={jalaliPickerValue(eventDate)} onChange={(value) => { const nextDate = selectedIsoDate(value); if (nextDate) setEventDate(nextDate); }} calendar={persian} locale={persianFa} format="YYYY/MM/DD" calendarPosition="bottom-right" inputClass="input jalali-input" containerClassName="datepicker-container" portal zIndex={1600} editable={false} /></div><div className="field"><label>ساعت <span className="timezone-label">به وقت تهران (+۰۳:۳۰)</span></label><input className="input time-input" value={eventTime} onChange={(event) => setEventTime(event.target.value)} type="time" /></div><div className="field"><label>کی یادت بندازم؟</label><select className="input" name="reminder"><option>یک روز قبل</option><option>یک هفته قبل</option><option>یک ماه قبل</option><option>همان موقع</option></select></div><div className="timezone-note"><Clock3 size={15} /> همه‌ی ساعت‌ها با منطقه‌ی زمانی تهران ذخیره می‌شن.</div><button className="primary-button" type="submit">بذار توی تقویممون</button></form></Sheet>;
}

function CycleSheet({ cycle, partnerName, onClose, onSave }: { cycle: CycleState; partnerName: string; onClose: () => void; onSave: (cycle: CycleState) => void }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState(cycle.symptoms);
  const [periodStart, setPeriodStart] = useState(cycle.lastPeriodStart);
  const symptoms = ["گرفتگی", "سردرد", "نفخ", "خستگی", "حساسیت", "انرژی خوب", "خلق آرام", "بی‌خوابی"];
  const toggleSymptom = (symptom: string) => setSelectedSymptoms((current) => current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSave({
      lastPeriodStart: periodStart,
      cycleLength: Number(data.get("cycleLength")),
      periodLength: Number(data.get("periodLength")),
      symptoms: selectedSymptoms,
      note: String(data.get("note")),
      sharedWithPartner: data.get("sharedWithPartner") === "on",
    });
  };
  return <Sheet onClose={onClose}><p className="eyebrow">بدن من، انتخاب من</p><h2>ثبت وضعیت چرخه</h2><form onSubmit={submit}>
    <div className="field"><label>شروع آخرین پریود <span className="timezone-label">تقویم شمسی</span></label><DatePicker value={jalaliPickerValue(periodStart)} onChange={(value) => { const nextDate = selectedIsoDate(value); if (nextDate) setPeriodStart(nextDate); }} maxDate={tehranToday()} calendar={persian} locale={persianFa} format="YYYY/MM/DD" calendarPosition="bottom-right" inputClass="input jalali-input" containerClassName="datepicker-container" portal zIndex={1600} editable={false} /></div>
    <div className="form-columns"><div className="field"><label>طول چرخه</label><div className="number-field"><input className="input" type="number" name="cycleLength" defaultValue={cycle.cycleLength} min="20" max="45" required /><span>روز</span></div></div><div className="field"><label>طول پریود</label><div className="number-field"><input className="input" type="number" name="periodLength" defaultValue={cycle.periodLength} min="2" max="10" required /><span>روز</span></div></div></div>
    <div className="field"><label>امروز چه حسی داری؟</label><div className="symptom-picker">{symptoms.map((symptom) => <button type="button" key={symptom} className={selectedSymptoms.includes(symptom) ? "selected" : ""} onClick={() => toggleSymptom(symptom)}>{symptom}</button>)}</div></div>
    <div className="field"><label>یادداشت اختیاری</label><textarea className="input compact-textarea" name="note" defaultValue={cycle.note} placeholder="مثلاً امروز کمی استراحت بیشتر لازم داشتم..." /></div>
    <label className="share-control"><span><UsersRound size={19} /><span><strong>نمایش برای {partnerName}</strong><small>فاز چرخه و تخمین پریود بعدی را می‌بیند</small></span></span><input type="checkbox" name="sharedWithPartner" defaultChecked={cycle.sharedWithPartner} /></label>
    <button className="primary-button" type="submit">ذخیره وضعیت</button>
  </form></Sheet>;
}

function IntimacySheet({ intimacy, partnerName, onClose, onSave }: { intimacy: IntimacyState; partnerName: string; onClose: () => void; onSave: (intimacy: IntimacyState) => void }) {
  const moods = [
    { emoji: "😏", label: "فاز فلرت" },
    { emoji: "🔥", label: "هورنی‌ام" },
    { emoji: "🫂", label: "بغل می‌خوام" },
    { emoji: "💋", label: "بوس‌مودم" },
    { emoji: "🌙", label: "تایم دوتامون" },
    { emoji: "🌿", label: "فعلاً اسپیس" },
  ];
  const stillActive = useSignalActive(intimacy);
  const [adultConfirmed, setAdultConfirmed] = useState(intimacy.adultConfirmed);
  const [selected, setSelected] = useState(stillActive ? moods.find((mood) => mood.label === intimacy.signal) ?? null : null);
  const [message, setMessage] = useState(stillActive ? intimacy.message : "");

  const send = () => {
    if (!adultConfirmed || !selected) return;
    const sentAt = new Date();
    onSave({ adultConfirmed, signal: selected.label, emoji: selected.emoji, message: message.trim(), sentAt: sentAt.toISOString(), expiresAt: new Date(sentAt.getTime() + 6 * 60 * 60 * 1000).toISOString() });
  };
  const withdraw = () => onSave({ ...intimacy, adultConfirmed, signal: null, emoji: null, message: "", sentAt: null, expiresAt: null });

  return <Sheet onClose={onClose}>
    <div className="intimacy-sheet-title"><span><Flame size={22} fill="currentColor" /></span><div><p className="eyebrow">هات‌لاین دوتایی 🔥</p><h2>الان چه ویبی داری؟</h2></div></div>
    <p className="warm-copy">یه سیگنال بانمک بفرست؛ دعوت محسوب می‌شه، نه انتظار یا فشار. جواب «نه» و «الان نه» همیشه کاملاً اوکیه.</p>
    <div className="intimacy-choices">{moods.map((mood) => <button type="button" key={mood.label} className={selected?.label === mood.label ? "selected" : ""} onClick={() => setSelected(mood)}><span>{mood.emoji}</span>{mood.label}</button>)}</div>
    <div className="field"><label>یه پیام کوچولو هم داری؟ <span className="optional">اختیاریه</span></label><textarea className="input compact-textarea" value={message} maxLength={180} onChange={(event) => setMessage(event.target.value)} placeholder="مثلاً: امشب دلم یه دیت خونه‌گی با تو می‌خواد..." /><small className="char-count">{fa.format(message.length)} / ۱۸۰</small></div>
    <label className="consent-check"><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} /><span><strong>هر دومون ۱۸+ هستیم</strong><small>و می‌دونم این فقط یک دعوت محترمانه‌ست؛ رضایت دوطرفه لازمه.</small></span></label>
    <div className="intimacy-expiry"><Clock3 size={16} /><span>این سیگنال بعد از ۶ ساعت خودکار محو می‌شه.</span></div>
    <button className="primary-button hot-button" disabled={!adultConfirmed || !selected} onClick={send}>بفرست برای {partnerName} 🔥</button>
    {stillActive && <button className="secondary-button withdraw-button" onClick={withdraw}>بی‌خیالش شدم، سیگنال رو بردار</button>}
  </Sheet>;
}

function MemorySheet({ viewerId, viewerName, onClose, onSave }: { viewerId: string; viewerName: string; onClose: () => void; onSave: (m: MemoryItem) => void }) {
  const [emoji, setEmoji] = useState("🤍");
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); onSave({ id: crypto.randomUUID(), title: String(data.get("title")), body: String(data.get("body")), date: "امروز", emoji, authorId: viewerId, authorName: viewerName }); };
  return <Sheet onClose={onClose}><p className="eyebrow">یک لحظه برای همیشه</p><h2>خاطره‌ی تازه</h2><form onSubmit={submit}><div className="field"><label>حال‌وهوای خاطره</label><div className="choice-grid">{["🤍","☕","🌿","🌊"].map((item) => <button type="button" key={item} className={`choice ${emoji === item ? "selected" : ""}`} onClick={() => setEmoji(item)}><span>{item}</span></button>)}</div></div><div className="field"><label>عنوان</label><input className="input" name="title" required maxLength={120} placeholder="اسم این خاطره..." /></div><div className="field"><label>چی شد؟</label><textarea className="input" name="body" required maxLength={5000} placeholder="هر چیزی که دوست داری یادتون بمونه..." /></div><button className="primary-button" type="submit">ثبت در دفتر ما</button></form></Sheet>;
}

function DailyQuestionSheet({ state, userId, coupleId, partnerName, onClose, onSave, onReact }: { state: ReturnType<typeof useNamiState>["state"]; userId: string; coupleId: string; partnerName: string; onClose: () => void; onSave: (promptKey: string, answer: string) => void; onReact: (reaction: string) => void }) {
  const prompt = dailyPrompt(coupleId, localIsoDate(tehranToday()));
  const ownAnswer = state.dailyAnswers.find((answer) => answer.userId === userId);
  const partnerAnswer = state.dailyAnswers.find((answer) => answer.userId !== userId);
  const [answer, setAnswer] = useState(ownAnswer?.answer ?? "");
  const reactions = ["😍", "😂", "🥹", "🫶", "🔥"];
  return <Sheet onClose={onClose}>
    <p className="eyebrow">{prompt.emoji} سؤال امروز</p><h2 className="daily-question-title">{prompt.text}</h2>
    {ownAnswer && partnerAnswer ? <>
      <div className="answer-reveal"><article><span>جواب تو</span><p>{ownAnswer.answer}</p></article><article className="partner-answer"><span>جواب {partnerName}</span><p>{partnerAnswer.answer}</p></article></div>
      <div className="field"><label>ری‌اکشنت به جواب {partnerName}</label><div className="reaction-row">{reactions.map((reaction) => <button key={reaction} className={ownAnswer.reaction === reaction ? "selected" : ""} onClick={() => onReact(reaction)}>{reaction}</button>)}</div></div>
    </> : <>
      {ownAnswer && <div className="locked-answer"><LockKeyhole size={20} /><div><strong>جوابت ثبت شده و فعلاً قفله</strong><span>همین که {partnerName} جواب بده، هر دو جواب باهم باز می‌شن.</span></div></div>}
      <div className="field"><label>{ownAnswer ? "اگه خواستی جوابت رو ادیت کن" : "جواب خودمونی تو"}</label><textarea className="input" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={500} placeholder="هرچی واقعاً توی دلت هست..." /><small className="char-count">{fa.format(answer.length)} / ۵۰۰</small></div>
      <button className="primary-button" disabled={!answer.trim()} onClick={() => onSave(prompt.id, answer)}>{ownAnswer ? "ذخیره ادیت" : "جوابمو قفل کن 🔒"}</button>
    </>}
  </Sheet>;
}

function PokeSheet({ partnerName, onClose, onSend }: { partnerName: string; onClose: () => void; onSend: (kind: PokeKind, message: string) => void }) {
  const [kind, setKind] = useState<PokeKind>("hug");
  const [message, setMessage] = useState("");
  return <Sheet onClose={onClose}>
    <p className="eyebrow">یه «یادتم» کوچولو</p><h2>به {partnerName} چی بفرستیم؟</h2>
    <div className="poke-picker">{POKES.map((poke) => <button key={poke.kind} className={kind === poke.kind ? "selected" : ""} onClick={() => setKind(poke.kind)}><span>{poke.emoji}</span>{poke.label}</button>)}</div>
    <div className="field"><label>یه پیام کوتاه هم داری؟ <span className="optional">اختیاری</span></label><input className="input" value={message} maxLength={80} onChange={(event) => setMessage(event.target.value)} placeholder="مثلاً زودتر بیا، دلم برات تنگ شده..." /><small className="char-count">{fa.format(message.length)} / ۸۰</small></div>
    <button className="primary-button" onClick={() => onSend(kind, message)}><Send size={18} /> بفرست برای {partnerName}</button>
    <p className="poke-limit">برای اینکه بانمک بمونه، هر ساعت حداکثر ۱۰ تلنگر می‌تونی بفرستی.</p>
  </Sheet>;
}

function ChallengeSheet({ state, userId, coupleId, partnerName, onClose, onState, onAdultToggle }: { state: ReturnType<typeof useNamiState>["state"]; userId: string; coupleId: string; partnerName: string; onClose: () => void; onState: (key: string, deck: ChallengeDeck, state: ChallengeState) => void; onAdultToggle: (enabled: boolean) => void }) {
  const [deck, setDeck] = useState<ChallengeDeck>("general");
  const activeDeck = deck === "adult" && !state.funPreferences.adultDeckUnlocked ? "general" : deck;
  const today = localIsoDate(tehranToday());
  const challenge = dailyChallenge(coupleId, today, activeDeck);
  const own = state.challengeResponses.find((response) => response.userId === userId && response.challengeKey === challenge.id);
  const partner = state.challengeResponses.find((response) => response.userId !== userId && response.challengeKey === challenge.id);
  const bothDone = own?.state === "completed" && partner?.state === "completed";
  const statusLabel = (value?: ChallengeState) => value === "completed" ? "انجامش داده ✅" : value === "accepted" ? "پایه‌ست 👀" : value === "skipped" ? "فعلاً رد کرده" : "هنوز جواب نداده";
  return <Sheet onClose={onClose}>
    <p className="eyebrow">چالش امروز دوتاتون</p><h2>یه حرکت کوچیک، یه حال خوب 🎯</h2>
    <div className="challenge-tabs"><button className={activeDeck === "general" ? "selected" : ""} onClick={() => setDeck("general")}>فان روزانه</button><button className={activeDeck === "adult" ? "selected adult" : "adult"} disabled={!state.funPreferences.adultDeckUnlocked} onClick={() => setDeck("adult")}><LockKeyhole size={14} /> After Dark</button></div>
    <article className={`challenge-detail ${activeDeck === "adult" ? "adult" : ""}`}><span>{challenge.emoji}</span><h3>{challenge.text}</h3>{bothDone && <div className="challenge-win"><Sparkles size={18} /> انجامش دادین؛ تیم خفنی هستین!</div>}</article>
    <div className="challenge-status"><div><strong>تو</strong><span>{statusLabel(own?.state)}</span></div><div><strong>{partnerName}</strong><span>{statusLabel(partner?.state)}</span></div></div>
    <div className="challenge-actions">
      {own?.state !== "completed" && <button className="primary-button" onClick={() => onState(challenge.id, activeDeck, own?.state === "accepted" ? "completed" : "accepted")}>{own?.state === "accepted" ? <><Check size={18} /> انجامش دادم</> : "من پایه‌ام 🙌"}</button>}
      {own?.state === "completed" && <button className="primary-button" disabled><Check size={18} /> انجام شد</button>}
      {own?.state !== "completed" && <button className="secondary-button" onClick={() => onState(challenge.id, activeDeck, "skipped")}>امروز نه، بعدی رو می‌ریم</button>}
    </div>
    <div className="after-dark-optin"><div><strong>After Dark 🔒</strong><p>فقط وقتی هر دوتون جداگانه ۱۸+ بودن و رضایت دادین باز می‌شه. هیچ محتوای صریحی توی اعلان نمیاد.</p></div><Switch checked={state.funPreferences.viewerAdultEnabled} onChange={(_event, checked) => onAdultToggle(checked)} /></div>
    {state.funPreferences.viewerAdultEnabled && !state.funPreferences.adultDeckUnlocked && <p className="adult-waiting">درخواستت ثبت شد؛ منتظر تأیید مستقل {partnerName} هستیم.</p>}
  </Sheet>;
}

function ProfileSheet({ name, avatarUrl, onClose, onSave }: { name: string; avatarUrl: string | null; onClose: () => void; onSave: (name: string, avatar: File | null) => void }) {
  const [displayName, setDisplayName] = useState(name);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);

  useEffect(() => () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectAvatar = (file?: File) => {
    if (!file) return;
    setAvatar(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  return <Sheet onClose={onClose}>
    <p className="eyebrow">همون خودِ قشنگت</p><h2>پروفایلت رو بچین ✨</h2>
    <div className="profile-editor-avatar"><PersonAvatar name={displayName || name} url={previewUrl} /><label className="avatar-picker"><Camera size={17} /> انتخاب عکس<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectAvatar(event.target.files?.[0])} /></label><small>JPG، PNG یا WebP تا ۵ مگابایت</small></div>
    <div className="field"><label htmlFor="profile-name">اسمی که پارتنرت می‌بینه</label><input id="profile-name" className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={1} maxLength={60} required autoComplete="name" /></div>
    <button className="primary-button" disabled={!displayName.trim()} onClick={() => onSave(displayName, avatar)}>ذخیره تغییرات</button>
  </Sheet>;
}

function RelationshipSheet({ value, onClose, onSave }: { value: string; onClose: () => void; onSave: (date: string) => void }) {
  const [date, setDate] = useState(value);
  return <Sheet onClose={onClose}><p className="eyebrow">شروع قصه‌ی شما</p><h2>از کی «ما» شدین؟</h2><div className="field"><label>تاریخ شروع <span className="timezone-label">تقویم شمسی</span></label><DatePicker value={jalaliPickerValue(date)} onChange={(value) => { const nextDate = selectedIsoDate(value); if (nextDate) setDate(nextDate); }} maxDate={tehranToday()} calendar={persian} locale={persianFa} format="YYYY/MM/DD" calendarPosition="bottom-right" inputClass="input jalali-input" containerClassName="datepicker-container" portal zIndex={1600} editable={false} /></div><button className="primary-button" onClick={() => onSave(date)}>ذخیره تاریخ</button></Sheet>;
}

function InviteSheet({ viewerName, partnerName, onClose }: { viewerName: string; partnerName: string; onClose: () => void }) {
  return <Sheet onClose={onClose}><p className="eyebrow">فضای خصوصی شما 🔒</p><h2>{viewerName} و {partnerName}</h2><div className="card" style={{ textAlign: "center", boxShadow: "none", marginBottom: 16 }}><UsersRound size={38} color="var(--primary)" /><p className="muted" style={{ margin: "12px 0 4px" }}>اتصال دوتایی فعاله</p><strong>فقط شما دوتا به این فضا دسترسی دارین</strong></div><p className="muted" style={{ fontSize: 12 }}>مودها، پلن‌ها، خاطره‌ها و سیگنال‌ها با قوانین امنیتی دیتابیس فقط بین شما به اشتراک گذاشته می‌شن.</p><button className="primary-button" onClick={onClose}>اوکی، بریم ادامه بدیم</button></Sheet>;
}
