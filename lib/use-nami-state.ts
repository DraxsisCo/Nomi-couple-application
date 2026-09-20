"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CycleState, EventItem, IntimacyState, MemoryItem, MoodState } from "./types";
import { createSupabaseBrowserClient } from "./supabase/client";

export type ProductionScope = {
  userId: string;
  coupleId: string;
  viewerName: string;
  partnerName: string;
  relationshipStartedOn: string;
};

export type NamiState = {
  onboarded: true;
  mood: MoodState | null;
  activity: string | null;
  partnerMood: MoodState | null;
  partnerActivity: string | null;
  events: EventItem[];
  memories: MemoryItem[];
  notifications: boolean;
  quietHours: boolean;
  cycle: CycleState | null;
  intimacy: IntimacyState;
  partnerIntimacy: IntimacyState | null;
  relationshipStartedOn: string;
};

type SupabaseError = { message: string; code?: string; hint?: string | null; details?: string | null };

function tehranDateDaysAgo(days: number) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const date = new Date(get("year"), get("month") - 1, get("day") - days, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function createDefaultCycle(): CycleState {
  return { lastPeriodStart: tehranDateDaysAgo(0), cycleLength: 28, periodLength: 5, symptoms: [], note: "", sharedWithPartner: false };
}

export function createDefaultIntimacy(adultConfirmed = false): IntimacyState {
  return { adultConfirmed, signal: null, emoji: null, message: "", sentAt: null, expiresAt: null };
}

function initialState(scope: ProductionScope): NamiState {
  return {
    onboarded: true,
    mood: null,
    activity: null,
    partnerMood: null,
    partnerActivity: null,
    events: [],
    memories: [],
    notifications: false,
    quietHours: true,
    cycle: null,
    intimacy: createDefaultIntimacy(),
    partnerIntimacy: null,
    relationshipStartedOn: scope.relationshipStartedOn,
  };
}

const reminderLabels = new Map<number, string>([[0, "همان موقع"], [1440, "یک روز قبل"], [10080, "یک هفته قبل"], [43200, "یک ماه قبل"]]);
const reminderMinutes = new Map<string, number>([["همان موقع", 0], ["یک روز قبل", 1440], ["یک هفته قبل", 10080], ["یک ماه قبل", 43200]]);

function eventFromRow(row: Record<string, unknown>): EventItem {
  const date = new Date(String(row.starts_at));
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: "Asia/Tehran", day: "numeric", month: "long" }).formatToParts(date);
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const rawDay = parts.find((part) => part.type === "day")?.value || "1";
  const day = Number(rawDay.replace(/[۰-۹]/g, (digit) => String(faDigits.indexOf(digit))));
  const time = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  const offsets = Array.isArray(row.reminder_offsets) ? row.reminder_offsets as number[] : [];
  return { id: String(row.id), title: String(row.title), day, month: parts.find((part) => part.type === "month")?.value || "", time: row.all_day ? "تمام روز" : time, daysLeft: Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000)), reminder: reminderLabels.get(offsets[0] ?? 1440) ?? "یک روز قبل", startsAt: date.toISOString() };
}

function signalFromRow(row: Record<string, unknown>, adultConfirmed: boolean): IntimacyState {
  return { adultConfirmed, signal: String(row.signal), emoji: String(row.emoji), message: String(row.message ?? ""), sentAt: String(row.created_at), expiresAt: String(row.expires_at), senderId: String(row.sender_id) };
}

function throwIfError(error: SupabaseError | null, operation: string) {
  if (!error) return;
  console.error(`[Nami] ${operation}`, error);
  throw new Error(`ذخیره‌ی ${operation} انجام نشد. اینترنتت رو چک کن و دوباره امتحان کن.`);
}

export function useNamiState(scope: ProductionScope) {
  const [state, setState] = useState<NamiState>(() => initialState(scope));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const load = useCallback(async () => {
    const client = createSupabaseBrowserClient();
    if (!client) { setError("اتصال امن نامی به سرور تنظیم نشده."); setReady(true); return; }
    try {
      const [statuses, events, entries, settings, log, prefs, signals, profile] = await Promise.all([
        client.from("statuses").select("*").eq("couple_id", scope.coupleId),
        client.from("events").select("*").eq("couple_id", scope.coupleId).gte("starts_at", new Date().toISOString()).order("starts_at"),
        client.from("diary_entries").select("*, diary_replies(body, author_id, created_at)").eq("couple_id", scope.coupleId).order("happened_on", { ascending: false }).order("created_at", { ascending: false }),
        client.from("cycle_settings").select("*").eq("user_id", scope.userId).maybeSingle(),
        client.from("cycle_logs").select("*").eq("user_id", scope.userId).order("logged_on", { ascending: false }).limit(1).maybeSingle(),
        client.from("notification_preferences").select("*").eq("user_id", scope.userId).maybeSingle(),
        client.from("intimacy_signals").select("*").eq("couple_id", scope.coupleId).is("withdrawn_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
        client.from("profiles").select("adult_confirmed_at").eq("id", scope.userId).maybeSingle(),
      ]);
      const failed = [statuses, events, entries, settings, log, prefs, signals, profile].find((result) => result.error);
      throwIfError(failed?.error as SupabaseError | null, "اطلاعات");
      const own = statuses.data?.find((item) => item.user_id === scope.userId);
      const partner = statuses.data?.find((item) => item.user_id !== scope.userId);
      const cycle = settings.data;
      const daily = log.data;
      const pref = prefs.data;
      const adultConfirmed = Boolean(profile.data?.adult_confirmed_at);
      const ownSignal = signals.data?.find((item) => item.sender_id === scope.userId);
      const partnerSignal = signals.data?.find((item) => item.sender_id !== scope.userId);
      setState((current) => ({
        ...current,
        mood: own ? { emoji: own.mood_emoji, label: own.mood } : null,
        activity: own?.activity ?? null,
        partnerMood: partner ? { emoji: partner.mood_emoji, label: partner.mood } : null,
        partnerActivity: partner?.activity ?? null,
        events: events.data?.map((row) => eventFromRow(row as Record<string, unknown>)) ?? [],
        memories: entries.data?.map((row) => {
          const replies = Array.isArray(row.diary_replies) ? [...row.diary_replies].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))) : [];
          const reply = replies[0];
          const authorId = String(row.author_id);
          const replyAuthorId = reply ? String(reply.author_id) : "";
          return { id: String(row.id), title: String(row.title), body: String(row.body), date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "long", timeZone: "Asia/Tehran" }).format(new Date(`${row.happened_on}T12:00:00+03:30`)), emoji: String(row.emoji ?? "🤍"), authorId, authorName: authorId === scope.userId ? scope.viewerName : scope.partnerName, reply: reply?.body ? String(reply.body) : undefined, replyAuthorName: replyAuthorId === scope.userId ? scope.viewerName : scope.partnerName };
        }) ?? [],
        cycle: cycle ? { lastPeriodStart: cycle.last_period_start, cycleLength: cycle.cycle_length, periodLength: cycle.period_length, sharedWithPartner: cycle.shared_with_partner, symptoms: daily?.symptoms ?? [], note: daily?.note ?? "" } : null,
        notifications: pref?.status_updates ?? false,
        quietHours: Boolean(pref?.quiet_start),
        intimacy: ownSignal ? signalFromRow(ownSignal as Record<string, unknown>, adultConfirmed) : createDefaultIntimacy(adultConfirmed),
        partnerIntimacy: partnerSignal ? signalFromRow(partnerSignal as Record<string, unknown>, adultConfirmed) : null,
      }));
      setError(null);
    } catch (loadError) {
      console.error("[Nami] load", loadError);
      setError(loadError instanceof Error ? loadError.message : "اطلاعات از سرور دریافت نشد.");
    } finally { setReady(true); }
  }, [scope]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    const reload = () => void load();
    const notifyPartnerUpdate = (title: string, body: string) => {
      if (!stateRef.current.notifications || typeof Notification === "undefined" || Notification.permission !== "granted" || document.visibilityState === "visible") return;
      const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", hour: "2-digit", hour12: false }).format(new Date()));
      if (stateRef.current.quietHours && (hour >= 23 || hour < 8)) return;
      if ("serviceWorker" in navigator) void navigator.serviceWorker.ready.then((registration) => registration.showNotification(title, { body, icon: "/icon.svg", badge: "/icon.svg", data: { url: "/" } }));
    };
    const coupleChannel = client.channel(`couple-${scope.coupleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "statuses", filter: `couple_id=eq.${scope.coupleId}` }, (payload) => { const row = payload.new as Record<string, unknown>; if (row.user_id && row.user_id !== scope.userId) notifyPartnerUpdate("یه آپدیت تازه توی نامی 💜", `${scope.partnerName} حال‌وهوایش را به‌روز کرد.`); reload(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `couple_id=eq.${scope.coupleId}` }, (payload) => { const row = payload.new as Record<string, unknown>; if (row.created_by && row.created_by !== scope.userId) notifyPartnerUpdate("یه پلن تازه دارین 📅", `${scope.partnerName} تقویم دوتایی‌تون را به‌روز کرد.`); reload(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "diary_entries", filter: `couple_id=eq.${scope.coupleId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "intimacy_signals", filter: `couple_id=eq.${scope.coupleId}` }, (payload) => { const row = payload.new as Record<string, unknown>; if (row.sender_id && row.sender_id !== scope.userId) notifyPartnerUpdate("یه پیام خصوصی توی نامی داری 🔒", `${scope.partnerName} یه سیگنال دوتایی فرستاده.`); reload(); })
      .subscribe((status, channelError) => { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.error("[Nami] realtime", status, channelError); });
    const privateChannel = client.channel(`user-${scope.userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cycle_settings", filter: `user_id=eq.${scope.userId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "cycle_logs", filter: `user_id=eq.${scope.userId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_preferences", filter: `user_id=eq.${scope.userId}` }, reload)
      .subscribe((status, channelError) => { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.error("[Nami] realtime", status, channelError); });
    return () => { void client.removeChannel(coupleChannel); void client.removeChannel(privateChannel); };
  }, [scope, load]);

  const update = useCallback(async (patch: Partial<NamiState>) => {
    const previous = stateRef.current;
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    try {
      if (patch.mood !== undefined || patch.activity !== undefined) {
        if (!patch.mood && !previous.mood) throw new Error("اول مودت رو انتخاب کن.");
        const result = await client.from("statuses").upsert({ user_id: scope.userId, couple_id: scope.coupleId, mood: patch.mood?.label ?? previous.mood?.label, mood_emoji: patch.mood?.emoji ?? previous.mood?.emoji, activity: patch.activity ?? previous.activity ?? "", updated_at: new Date().toISOString() });
        throwIfError(result.error, "حال‌و‌هوا");
      }
      if (patch.events) {
        const added = patch.events.find((item) => !previous.events.some((old) => old.id === item.id));
        if (added) { const result = await client.from("events").insert({ id: added.id, couple_id: scope.coupleId, created_by: scope.userId, title: added.title, starts_at: added.startsAt ?? new Date().toISOString(), reminder_offsets: [reminderMinutes.get(added.reminder) ?? 1440] }); throwIfError(result.error, "قرار"); }
      }
      if (patch.memories) {
        const added = patch.memories.find((item) => !previous.memories.some((old) => old.id === item.id));
        if (added) { const result = await client.from("diary_entries").insert({ id: added.id, couple_id: scope.coupleId, author_id: scope.userId, title: added.title, body: added.body, emoji: added.emoji, happened_on: tehranDateDaysAgo(0) }); throwIfError(result.error, "خاطره"); }
      }
      if (patch.cycle) {
        const settingsResult = await client.from("cycle_settings").upsert({ user_id: scope.userId, last_period_start: patch.cycle.lastPeriodStart, cycle_length: patch.cycle.cycleLength, period_length: patch.cycle.periodLength, shared_with_partner: patch.cycle.sharedWithPartner, updated_at: new Date().toISOString() });
        throwIfError(settingsResult.error, "تنظیمات چرخه");
        const logResult = await client.from("cycle_logs").upsert({ user_id: scope.userId, logged_on: tehranDateDaysAgo(0), symptoms: patch.cycle.symptoms, note: patch.cycle.note, updated_at: new Date().toISOString() }, { onConflict: "user_id,logged_on" });
        throwIfError(logResult.error, "وضعیت چرخه");
      }
      if (patch.intimacy) {
        if (patch.intimacy.adultConfirmed && !previous.intimacy.adultConfirmed) { const profileResult = await client.from("profiles").update({ adult_confirmed_at: new Date().toISOString() }).eq("id", scope.userId); throwIfError(profileResult.error, "تأیید سن"); }
        if (patch.intimacy.signal) { const signalResult = await client.from("intimacy_signals").insert({ couple_id: scope.coupleId, sender_id: scope.userId, signal: patch.intimacy.signal, emoji: patch.intimacy.emoji, message: patch.intimacy.message, expires_at: patch.intimacy.expiresAt }); throwIfError(signalResult.error, "سیگنال"); }
        else { const withdrawResult = await client.from("intimacy_signals").update({ withdrawn_at: new Date().toISOString() }).eq("couple_id", scope.coupleId).eq("sender_id", scope.userId).is("withdrawn_at", null); throwIfError(withdrawResult.error, "سیگنال"); }
      }
      if (patch.notifications !== undefined || patch.quietHours !== undefined) {
        const prefResult = await client.from("notification_preferences").upsert({ user_id: scope.userId, status_updates: patch.notifications ?? previous.notifications, quiet_start: (patch.quietHours ?? previous.quietHours) ? "23:00" : null, quiet_end: (patch.quietHours ?? previous.quietHours) ? "08:00" : null, timezone: "Asia/Tehran", updated_at: new Date().toISOString() });
        throwIfError(prefResult.error, "تنظیمات اعلان");
      }
      if (patch.relationshipStartedOn) { const relationshipResult = await client.from("couples").update({ relationship_started_on: patch.relationshipStartedOn }).eq("id", scope.coupleId); throwIfError(relationshipResult.error, "تاریخ رابطه"); }
      await load();
    } catch (updateError) {
      console.error("[Nami] save", updateError);
      throw updateError instanceof Error ? updateError : new Error("ذخیره انجام نشد؛ دوباره امتحان کن.");
    }
  }, [scope, load]);

  return { state, update, ready, error, reload: load };
}
