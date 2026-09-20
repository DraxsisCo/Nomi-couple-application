"use client";

import {
  Bell, BellRing, BookHeart, CalendarDays, ChevronLeft, ChevronRight, Clock3, Droplets,
  Flame, Heart, Home, ImagePlus, LockKeyhole, LogOut, Moon,
  MoreHorizontal, Plus, Settings, ShieldCheck, Sparkles, UserRound, UsersRound, Waves,
  WifiOff, X,
} from "lucide-react";
import { Alert, BottomNavigation, BottomNavigationAction, Fab, Snackbar, SwipeableDrawer, Switch } from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import DatePicker, { DateObject } from "react-multi-date-picker";
import { useRouter } from "next/navigation";
import gregorian from "react-date-object/calendars/gregorian";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";
import { createDefaultCycle, createDefaultIntimacy, ProductionScope, useNamiState } from "@/lib/use-nami-state";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ACTIVITIES, CycleState, EventItem, IntimacyState, MemoryItem, MOODS, Tab } from "@/lib/types";

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

export function CouplesApp({ production }: { production?: ProductionScope }) {
  const { state, update, ready } = useNamiState(production);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("home");
  const [modal, setModal] = useState<"status" | "event" | "cycle" | "intimacy" | "memory" | "invite" | null>(null);
  const [toast, setToast] = useState("");
  const [online, setOnline] = useState(true);
  const cycle = state.cycle ?? createDefaultCycle();
  const intimacy = state.intimacy ?? createDefaultIntimacy();

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const sync = () => setOnline(navigator.onLine);
    sync(); window.addEventListener("online", sync); window.addEventListener("offline", sync);
    return () => { window.removeEventListener("online", sync); window.removeEventListener("offline", sync); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!ready) return null;
  if (!state.onboarded) return <Welcome onStart={() => update({ onboarded: true })} />;

  const openAdd = () => setModal(tab === "calendar" ? "event" : tab === "cycle" ? "cycle" : tab === "diary" ? "memory" : "status");
  const addLabel = tab === "calendar" ? "افزودن قرار" : tab === "cycle" ? "ثبت وضعیت چرخه" : tab === "diary" ? "ثبت خاطره" : "به‌روزرسانی حال";

  return (
    <main className="app-shell">
      <Snackbar open={Boolean(toast)} autoHideDuration={2800} onClose={() => setToast("")} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert icon={false} variant="filled" severity="success" onClose={() => setToast("")}>{toast}</Alert>
      </Snackbar>
      {!online && <div className="toast"><WifiOff size={15} /> حالت آفلاین؛ تغییرات روی دستگاه ذخیره می‌شوند</div>}
      <div className="page">
        <Header viewerName={production?.viewerName || "سارا"} partnerName={production?.partnerName || "آرین"} onInvite={() => setModal("invite")} />
        <div className="view-enter" key={tab}>
        {tab === "home" && <HomeView state={state} intimacy={intimacy} viewerName={production?.viewerName || "سارا"} partnerName={production?.partnerName || "آرین"} openStatus={() => setModal("status")} openIntimacy={() => setModal("intimacy")} goTo={setTab} />}
        {tab === "calendar" && <CalendarView events={state.events} />}
        {tab === "cycle" && <CycleView cycle={cycle} onLog={() => setModal("cycle")} onShare={() => update({ cycle: { ...cycle, sharedWithPartner: !cycle.sharedWithPartner } })} />}
        {tab === "diary" && <DiaryView memories={state.memories} />}
        {tab === "settings" && (
          <SettingsView
            notifications={state.notifications}
            quietHours={state.quietHours}
            onNotifications={async () => {
              if (!state.notifications && "Notification" in window) {
                const permission = await Notification.requestPermission();
                if (permission !== "granted") { setToast("اجازه‌ی اعلان داده نشد؛ هر وقت خواستی از تنظیمات مرورگر فعالش کن"); return; }
              }
              update({ notifications: !state.notifications });
              setToast(!state.notifications ? "اعلان‌ها فعال شدند" : "اعلان‌ها خاموش شدند");
            }}
            onQuiet={() => update({ quietHours: !state.quietHours })}
            onReset={async () => { if (production) { await createSupabaseBrowserClient()?.auth.signOut(); router.push("/login"); router.refresh(); } else update({ onboarded: false }); }}
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
          currentActivity={state.activity}
          onClose={() => setModal(null)}
          onSave={(mood, activity) => { update({ mood, activity }); setModal(null); setToast(`مودت برای ${production?.partnerName || "آرین"} آپدیت شد 💜`); }}
        />
      )}
      {modal === "event" && (
        <EventSheet onClose={() => setModal(null)} onSave={(event) => { update({ events: [event, ...state.events] }); setModal(null); setToast("قرار جدید به تقویم دونفره اضافه شد"); }} />
      )}
      {modal === "cycle" && <CycleSheet cycle={cycle} onClose={() => setModal(null)} onSave={(nextCycle) => { update({ cycle: nextCycle }); setModal(null); setToast("وضعیت چرخه ثبت شد"); }} />}
      {modal === "intimacy" && <IntimacySheet intimacy={intimacy} onClose={() => setModal(null)} onSave={(nextIntimacy) => { update({ intimacy: nextIntimacy }); setModal(null); setToast(nextIntimacy.signal ? "سیگنالت رفت برای آرین 😏" : "سیگنال برداشته شد، اوکیه 🤍"); }} />}
      {modal === "memory" && (
        <MemorySheet onClose={() => setModal(null)} onSave={(memory) => { update({ memories: [memory, ...state.memories] }); setModal(null); setToast("خاطره‌تون ثبت شد 🤍"); }} />
      )}
      {modal === "invite" && <InviteSheet viewerName={production?.viewerName || "سارا"} partnerName={production?.partnerName || "آرین"} connected={Boolean(production)} onClose={() => setModal(null)} onCopy={() => { navigator.clipboard?.writeText("https://nami.app/join/NAMI-2486"); setToast("لینک دعوت کپی شد"); }} />}
    </main>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <main className="welcome">
      <section className="welcome-card">
        <div className="welcome-logo"><Heart size={42} fill="currentColor" /></div>
        <p className="eyebrow">فضای امن دونفره</p>
        <h1>به دنیای کوچیک<br />خودتون خوش اومدین</h1>
        <p className="muted">حال همدیگه رو بدونین، قرارها رو فراموش نکنین و خاطره‌هاتون رو یک‌جا نگه دارین.</p>
        <div className="mini-features">
          <div className="mini-feature"><Sparkles size={21} />حال‌و‌هوا</div>
          <div className="mini-feature"><CalendarDays size={21} />قرارها</div>
          <div className="mini-feature"><BookHeart size={21} />خاطره‌ها</div>
        </div>
        <button className="primary-button" onClick={onStart}>شروع نسخه‌ی نمایشی</button>
        <p className="muted" style={{ fontSize: 11, margin: "16px 0 0" }}><LockKeyhole size={12} style={{ verticalAlign: "middle" }} /> اطلاعات شما فقط بین خودتان می‌ماند</p>
      </section>
    </main>
  );
}

function Header({ viewerName, partnerName, onInvite }: { viewerName: string; partnerName: string; onInvite: () => void }) {
  return (
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Heart size={21} fill="currentColor" /></span> نامی</div>
      <button className="avatar-pair" aria-label="اطلاعات زوج" onClick={onInvite} style={{ border: 0, background: "transparent", padding: 0 }}>
        <span className="avatar">{viewerName.slice(0, 1)}</span><span className="avatar partner-avatar">{partnerName.slice(0, 1)}<span className="online-dot" /></span>
      </button>
    </header>
  );
}

function HomeView({ state, intimacy, viewerName, partnerName, openStatus, openIntimacy, goTo }: { state: ReturnType<typeof useNamiState>["state"]; intimacy: IntimacyState; viewerName: string; partnerName: string; openStatus: () => void; openIntimacy: () => void; goTo: (tab: Tab) => void }) {
  const next = state.events[0];
  return <>
    <div className="greeting-row"><div><p className="eyebrow">هی {viewerName} 🫶</p><h1>امروز دلت چه مودیه؟</h1></div><span className="date-chip">امروز</span></div>
    <section className="card hero-card">
      <div className="hero-title"><div><span className="muted">از روزی که «ما» شدیم</span><div className="together-days">{fa.format(428)} روز</div><span className="muted">پر از ویـب خوب و خاطره ✨</span></div><div className="heart-orbit"><Heart size={31} fill="currentColor" /></div></div>
    </section>

    <div className="section-head"><h2>مود دوتامون</h2><button className="text-button" onClick={openStatus}>مودمو عوض کن</button></div>
    <section className="status-grid">
      <div className="card status-card">
        <div className="status-person"><span className="avatar">س</span><div><strong>تو</strong><small>همین الان</small></div></div>
        <div className="mood-bubble"><span className="mood-emoji">{state.mood.emoji}</span><strong>{state.mood.label}</strong></div>
        <div className="activity"><Clock3 size={13} /> {state.activity}</div>
      </div>
      <div className="card status-card">
        <div className="status-person"><span className="avatar" style={{ background: "var(--rose)" }}>{partnerName.slice(0, 1)}</span><div><strong>{partnerName}</strong><small>آخرین وضعیت</small></div></div>
        <div className="mood-bubble" style={{ background: "var(--rose-soft)" }}><span className="mood-emoji">{state.partnerMood.emoji}</span><strong>{state.partnerMood.label}</strong></div>
        <div className="activity"><Clock3 size={13} /> {state.partnerActivity}</div>
      </div>
    </section>
    <button className="update-card" onClick={openStatus}><span>مودت عوض شد؟ به آرین یه سیگنال بده</span><ChevronLeft size={20} /></button>

    <IntimacyCard intimacy={intimacy} onOpen={openIntimacy} />

    <div className="section-head"><h2>پلن بعدیمون</h2><button className="text-button" onClick={() => goTo("calendar")}>همه پلن‌ها</button></div>
    {next && <EventCard event={next} />}

    <div className="section-head"><h2>آخرین خاطره‌بازی</h2><button className="text-button" onClick={() => goTo("diary")}>آلبوم ما</button></div>
    <button className="card memory-preview" onClick={() => goTo("diary")} style={{ width: "100%", textAlign: "right", color: "inherit" }}>
      <div className="memory-art">{state.memories[0]?.emoji || "🤍"}</div><div><h3>{state.memories[0]?.title || "اولین خاطره‌تون رو بسازین"}</h3><span className="eyebrow">{state.memories[0]?.date}</span><p>{state.memories[0]?.body}</p></div>
    </button>
  </>;
}

function IntimacyCard({ intimacy, onOpen }: { intimacy: IntimacyState; onOpen: () => void }) {
  const isActive = useSignalActive(intimacy);
  return <section className="intimacy-card">
    <div className="intimacy-card-copy"><span className="intimacy-icon"><Flame size={21} fill="currentColor" /></span><div><span className="intimacy-kicker">فقط بین خودتون 🔒</span><h3>{isActive ? `${intimacy.emoji} مودت: ${intimacy.signal}` : "امشب چه ویبی داری؟"}</h3><p>{isActive ? (intimacy.message || "آرین سیگنالت رو می‌بینه و می‌تونه جواب بده") : "فلرت، بغل یا یه مود هات؟ بدون فشار، فقط یه سیگنال کوچیک."}</p></div></div>
    <button onClick={onOpen}>{isActive ? "عوضش کن" : "بگو ببینم 😏"}<ChevronLeft size={18} /></button>
  </section>;
}

function EventCard({ event }: { event: EventItem }) {
  return <div className="card event-card"><div className="date-box"><strong>{fa.format(event.day)}</strong><small>{event.month}</small></div><div><h3>{event.title}</h3><p><Clock3 size={12} style={{ verticalAlign: "middle" }} /> {event.time} · تهران</p></div><div className="countdown"><strong>{fa.format(event.daysLeft)}</strong>روز دیگه</div></div>;
}

function CalendarView({ events }: { events: EventItem[] }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const days = [30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2];
  const visibleEvents = selectedDay === null ? events : events.filter((event) => event.day === selectedDay && event.month === "شهریور");
  return <>
    <p className="eyebrow">پلن‌هامون، یه‌جا ✨</p><h1>تقویم دوتایی</h1>
    <section className="card calendar">
      <div className="calendar-head"><div><h2 style={{ margin: 0 }}>شهریور ۱۴۰۵</h2><span className="muted" style={{ fontSize: 12 }}>۲۶ مرداد تا ۳۱ شهریور</span></div><div className="month-switch"><button className="icon-button" aria-label="ماه قبل"><ChevronRight size={19} /></button><button className="icon-button" aria-label="ماه بعد"><ChevronLeft size={19} /></button></div></div>
      <div className="week-grid">{["ش", "ی", "د", "س", "چ", "پ", "ج"].map((d) => <span key={d}>{d}</span>)}</div>
      <div className="days-grid">{days.map((day, i) => { const inMonth = i >= 2 && i <= 32; return <button key={i} disabled={!inMonth} aria-label={`${fa.format(day)} شهریور`} onClick={() => setSelectedDay(selectedDay === day ? null : day)} className={`day ${!inMonth ? "dim" : ""} ${day === 26 && i === 27 && selectedDay === null ? "today" : ""} ${selectedDay === day && inMonth ? "selected" : ""} ${[8,18,28].includes(day) && inMonth ? "has-event" : ""}`}>{fa.format(day)}</button>; })}</div>
    </section>
    <div className="section-head"><h2>{selectedDay === null ? "قرارهای پیش رو" : `قرارهای ${fa.format(selectedDay)} شهریور`}</h2>{selectedDay !== null ? <button className="text-button" onClick={() => setSelectedDay(null)}>نمایش همه</button> : <span className="muted">{fa.format(events.length)} قرار</span>}</div>
    <div className="event-list">{visibleEvents.map((event) => <div className="event-row" key={event.id}><span className="event-dot" /><div><strong>{event.title}</strong><p>{fa.format(event.day)} {event.month} · {event.time} تهران</p></div><button className="icon-button" aria-label={`گزینه‌های ${event.title}`}><MoreHorizontal size={20} color="var(--muted)" /></button></div>)}{visibleEvents.length === 0 && <div className="empty-state"><CalendarDays size={28} /><strong>برای این روز قراری ندارین</strong><span>با دکمه‌ی + یک وقت دونفره بسازین.</span></div>}</div>
  </>;
}

function CycleView({ cycle, onLog, onShare }: { cycle: CycleState; onLog: () => void; onShare: () => void }) {
  const info = cycleInfo(cycle);
  const progress = Math.min(100, Math.round((info.cycleDay / cycle.cycleLength) * 100));
  const nextSeven = Array.from({ length: 7 }, (_, index) => addDays(tehranToday(), index));
  return <>
    <div className="cycle-heading">
      <div><p className="eyebrow">شناخت بهتر بدن</p><h1>چرخه‌ی من</h1></div>
      <button className="privacy-chip" onClick={onShare} aria-pressed={cycle.sharedWithPartner}>
        {cycle.sharedWithPartner ? <UsersRound size={15} /> : <LockKeyhole size={15} />}
        {cycle.sharedWithPartner ? "مشترک با آرین" : "فقط برای من"}
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
    <div className="timeline">{memories.map((memory, index) => <article className="card memory-card" key={memory.id}><div className={`memory-photo ${index % 2 ? "alt" : ""}`}>{memory.emoji}</div><div className="memory-content"><div className="memory-meta"><span>{memory.date}</span><span>نوشته‌ی سارا</span></div><h2 style={{ margin: "10px 0 0" }}>{memory.title}</h2><p>{memory.body}</p>{memory.reply && <div className="reply"><span className="avatar">آ</span><span><strong>آرین</strong><br />{memory.reply}</span></div>}</div></article>)}</div>
  </>;
}

function SettingsView({ notifications, quietHours, onNotifications, onQuiet, onReset }: { notifications: boolean; quietHours: boolean; onNotifications: () => void; onQuiet: () => void; onReset: () => void }) {
  return <>
    <p className="eyebrow">همه‌چی همون‌جوری که تو می‌خوای</p><h1>تنظیماتِ خودمونی</h1>
    <section className="card" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}><span className="avatar" style={{ width: 58, height: 58, border: 0, fontSize: 20 }}>س</span><div><h2 style={{ margin: 0 }}>سارا محمدی</h2><span className="muted">همراه آرین از ۲۲ تیر ۱۴۰۴</span></div></section>
    <div className="settings-list">
      <Setting icon={BellRing} title="اعلان‌های نامی" subtitle="تغییر حال و یادآوری قرارها" action={<Switch checked={notifications} onChange={onNotifications} slotProps={{ input: { "aria-label": "تغییر اعلان‌ها" } }} />} />
      <Setting icon={Moon} title="ساعت آرامش" subtitle="از ۲۳ شب تا ۸ صبح" action={<Switch checked={quietHours} onChange={onQuiet} slotProps={{ input: { "aria-label": "تغییر ساعت آرامش" } }} />} />
      <Setting icon={Clock3} title="زمان و تاریخ" subtitle="تقویم شمسی · تهران (+۰۳:۳۰)" action={<ChevronLeft size={20} />} />
      <Setting icon={UserRound} title="حساب و پروفایل" subtitle="نام، تصویر و رمز عبور" action={<ChevronLeft size={20} />} />
      <Setting icon={UsersRound} title="فضای دونفره" subtitle="کد دعوت و اطلاعات همراه" action={<ChevronLeft size={20} />} />
      <Setting icon={ShieldCheck} title="حریم خصوصی" subtitle="اطلاعات و دسترسی‌ها" action={<ChevronLeft size={20} />} />
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

function StatusSheet({ currentMood, currentActivity, onClose, onSave }: { currentMood: { emoji: string; label: string }; currentActivity: string; onClose: () => void; onSave: (m: { emoji: string; label: string }, a: string) => void }) {
  const [mood, setMood] = useState(currentMood); const [activity, setActivity] = useState(currentActivity);
  return <Sheet onClose={onClose}><p className="eyebrow">یه آپدیت کوچولو برای آرین</p><h2>الان چه مود و فازی داری؟</h2><div className="choice-grid">{MOODS.map((m) => <button key={m.label} className={`choice ${m.label === mood.label ? "selected" : ""}`} onClick={() => setMood(m)}><span>{m.emoji}</span>{m.label}</button>)}</div><div className="field"><label>الان درگیر چی‌ای؟</label><select className="input" value={activity} onChange={(e) => setActivity(e.target.value)}>{ACTIVITIES.map((a) => <option key={a}>{a}</option>)}</select></div><button className="primary-button" onClick={() => onSave(mood, activity)}>مودمو بفرست ✨</button></Sheet>;
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
  return <Sheet onClose={onClose}><p className="eyebrow">یه تایم خوب برای دوتاتون</p><h2>پلن تازه ✨</h2><form onSubmit={submit}><div className="field"><label>اسم پلن</label><input className="input" name="title" required placeholder="مثلاً شام دونفره" /></div><div className="field"><label>تاریخ شمسی</label><DatePicker value={jalaliPickerValue(eventDate)} onChange={(value) => { if (value instanceof DateObject) setEventDate(value.convert(gregorian).format("YYYY-MM-DD")); }} calendar={persian} locale={persianFa} format="YYYY/MM/DD" calendarPosition="bottom-right" inputClass="input jalali-input" containerClassName="datepicker-container" /></div><div className="field"><label>ساعت <span className="timezone-label">به وقت تهران (+۰۳:۳۰)</span></label><input className="input time-input" value={eventTime} onChange={(event) => setEventTime(event.target.value)} type="time" /></div><div className="field"><label>کی یادت بندازم؟</label><select className="input" name="reminder"><option>یک روز قبل</option><option>یک هفته قبل</option><option>یک ماه قبل</option><option>همان موقع</option></select></div><div className="timezone-note"><Clock3 size={15} /> همه‌ی ساعت‌ها با منطقه‌ی زمانی تهران ذخیره می‌شن.</div><button className="primary-button" type="submit">بذار توی تقویممون</button></form></Sheet>;
}

function CycleSheet({ cycle, onClose, onSave }: { cycle: CycleState; onClose: () => void; onSave: (cycle: CycleState) => void }) {
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
    <div className="field"><label>شروع آخرین پریود <span className="timezone-label">تقویم شمسی</span></label><DatePicker value={jalaliPickerValue(periodStart)} onChange={(value) => { if (value instanceof DateObject) setPeriodStart(value.convert(gregorian).format("YYYY-MM-DD")); }} maxDate={tehranToday()} calendar={persian} locale={persianFa} format="YYYY/MM/DD" calendarPosition="bottom-right" inputClass="input jalali-input" containerClassName="datepicker-container" /></div>
    <div className="form-columns"><div className="field"><label>طول چرخه</label><div className="number-field"><input className="input" type="number" name="cycleLength" defaultValue={cycle.cycleLength} min="20" max="45" required /><span>روز</span></div></div><div className="field"><label>طول پریود</label><div className="number-field"><input className="input" type="number" name="periodLength" defaultValue={cycle.periodLength} min="2" max="10" required /><span>روز</span></div></div></div>
    <div className="field"><label>امروز چه حسی داری؟</label><div className="symptom-picker">{symptoms.map((symptom) => <button type="button" key={symptom} className={selectedSymptoms.includes(symptom) ? "selected" : ""} onClick={() => toggleSymptom(symptom)}>{symptom}</button>)}</div></div>
    <div className="field"><label>یادداشت اختیاری</label><textarea className="input compact-textarea" name="note" defaultValue={cycle.note} placeholder="مثلاً امروز کمی استراحت بیشتر لازم داشتم..." /></div>
    <label className="share-control"><span><UsersRound size={19} /><span><strong>نمایش برای آرین</strong><small>فاز چرخه و تخمین پریود بعدی را می‌بیند</small></span></span><input type="checkbox" name="sharedWithPartner" defaultChecked={cycle.sharedWithPartner} /></label>
    <button className="primary-button" type="submit">ذخیره وضعیت</button>
  </form></Sheet>;
}

function IntimacySheet({ intimacy, onClose, onSave }: { intimacy: IntimacyState; onClose: () => void; onSave: (intimacy: IntimacyState) => void }) {
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
    <button className="primary-button hot-button" disabled={!adultConfirmed || !selected} onClick={send}>بفرست برای آرین 🔥</button>
    {stillActive && <button className="secondary-button withdraw-button" onClick={withdraw}>بی‌خیالش شدم، سیگنال رو بردار</button>}
  </Sheet>;
}

function MemorySheet({ onClose, onSave }: { onClose: () => void; onSave: (m: MemoryItem) => void }) {
  const [emoji, setEmoji] = useState("🤍");
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); onSave({ id: crypto.randomUUID(), title: String(data.get("title")), body: String(data.get("body")), date: "امروز", emoji }); };
  return <Sheet onClose={onClose}><p className="eyebrow">یک لحظه برای همیشه</p><h2>خاطره‌ی تازه</h2><form onSubmit={submit}><div className="field"><label>حال‌وهوای خاطره</label><div className="choice-grid">{["🤍","☕","🌿","🌊"].map((item) => <button type="button" key={item} className={`choice ${emoji === item ? "selected" : ""}`} onClick={() => setEmoji(item)}><span>{item}</span></button>)}</div></div><div className="field"><label>عنوان</label><input className="input" name="title" required placeholder="اسم این خاطره..." /></div><div className="field"><label>چی شد؟</label><textarea className="input" name="body" required placeholder="هر چیزی که دوست داری یادتون بمونه..." /></div><button type="button" className="secondary-button" style={{ marginBottom: 10 }}><ImagePlus size={18} style={{ verticalAlign: "middle" }} /> افزودن عکس</button><button className="primary-button" type="submit">ثبت در دفتر ما</button></form></Sheet>;
}

function InviteSheet({ viewerName, partnerName, connected, onClose, onCopy }: { viewerName: string; partnerName: string; connected: boolean; onClose: () => void; onCopy: () => void }) {
  if (connected) return <Sheet onClose={onClose}><p className="eyebrow">فضای خصوصی شما 🔒</p><h2>{viewerName} و {partnerName}</h2><div className="card" style={{ textAlign: "center", boxShadow: "none", marginBottom: 16 }}><UsersRound size={38} color="var(--primary)" /><p className="muted" style={{ margin: "12px 0 4px" }}>اتصال دوتایی فعاله</p><strong>فقط شما دوتا به این فضا دسترسی دارین</strong></div><p className="muted" style={{ fontSize: 12 }}>مودها، پلن‌ها، خاطره‌ها و سیگنال‌ها با قوانین امنیتی دیتابیس فقط بین شما به اشتراک گذاشته می‌شن.</p><button className="primary-button" onClick={onClose}>اوکی، بریم ادامه بدیم</button></Sheet>;
  return <Sheet onClose={onClose}><p className="eyebrow">فضای خصوصی شما</p><h2>{viewerName} و {partnerName}</h2><div className="card" style={{ textAlign: "center", boxShadow: "none", marginBottom: 16 }}><UsersRound size={38} color="var(--primary)" /><p className="muted" style={{ margin: "12px 0 4px" }}>کد دعوت دونفره</p><strong style={{ fontSize: 27, letterSpacing: 3, direction: "ltr", display: "block" }}>NAMI-2486</strong></div><p className="muted" style={{ fontSize: 13 }}>این لینک فقط یک‌بار قابل استفاده است و بعد از ۲۴ ساعت منقضی می‌شود.</p><button className="primary-button" onClick={onCopy}>کپی لینک دعوت</button></Sheet>;
}
