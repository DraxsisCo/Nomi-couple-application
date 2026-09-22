"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityItem, ActivityType, ChallengeDeck, ChallengeResponse, ChallengeState, CouplePoke, CycleState, DailyAnswer, EventItem, FunPreferences, IntimacyState, MemoryItem, MoodState, PokeKind } from "./types";
import { createSupabaseBrowserClient } from "./supabase/client";
import { sendFunPush } from "./push";
import { readSafeSnapshot, saveSafeSnapshot } from "./offline-snapshot";

export type ProductionScope = {
  userId: string;
  partnerId: string;
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
  viewerName: string;
  partnerName: string;
  viewerAvatarPath: string | null;
  partnerAvatarPath: string | null;
  viewerAvatarUrl: string | null;
  partnerAvatarUrl: string | null;
  dailyAnswers: DailyAnswer[];
  pokes: CouplePoke[];
  challengeResponses: ChallengeResponse[];
  funPreferences: FunPreferences;
  activities: ActivityItem[];
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
    viewerName: scope.viewerName,
    partnerName: scope.partnerName,
    viewerAvatarPath: null,
    partnerAvatarPath: null,
    viewerAvatarUrl: null,
    partnerAvatarUrl: null,
    dailyAnswers: [],
    pokes: [],
    challengeResponses: [],
    funPreferences: { viewerAdultEnabled: false, partnerAdultEnabled: false, bothAdultsConfirmed: false, adultDeckUnlocked: false, viewerIntimacyEnabled: false, partnerIntimacyEnabled: false, intimacyUnlocked: false },
    activities: [],
  };
}

async function signedAvatarUrl(client: NonNullable<ReturnType<typeof createSupabaseBrowserClient>>, path: string | null | undefined) {
  if (!path) return null;
  const { data, error } = await client.storage.from("profile-avatars").createSignedUrl(path, 3600);
  if (error) { console.error("[Nami] avatar URL", error); return null; }
  return data.signedUrl;
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
  const millisecondsUntilStart = date.getTime() - Date.now();
  return { id: String(row.id), createdBy: row.created_by ? String(row.created_by) : undefined, title: String(row.title), day, month: parts.find((part) => part.type === "month")?.value || "", time: row.all_day ? "تمام روز" : time, daysLeft: Math.max(0, Math.ceil(millisecondsUntilStart / 86400000)), reminder: reminderLabels.get(offsets[0] ?? 1440) ?? "یک روز قبل", startsAt: date.toISOString(), isPast: millisecondsUntilStart < 0 };
}

function signalFromRow(row: Record<string, unknown>, adultConfirmed: boolean): IntimacyState {
  return { adultConfirmed, signal: String(row.signal), emoji: String(row.emoji), message: String(row.message ?? ""), sentAt: String(row.created_at), expiresAt: String(row.expires_at), senderId: String(row.sender_id) };
}

function activityFromRow(row: Record<string, unknown>): ActivityItem {
  const reactions = Array.isArray(row.activity_reactions) ? row.activity_reactions as Record<string, unknown>[] : [];
  const replies = Array.isArray(row.activity_replies) ? row.activity_replies as Record<string, unknown>[] : [];
  return { id: String(row.id), actorId: String(row.actor_id), type: row.activity_type as ActivityType, payload: (row.payload ?? {}) as Record<string, string | boolean | null>, createdAt: String(row.created_at), reactions: reactions.map((reaction) => ({ userId: String(reaction.user_id), reaction: String(reaction.reaction) })), replies: replies.map((reply) => ({ id: String(reply.id), authorId: String(reply.author_id), body: String(reply.body), updatedAt: String(reply.updated_at) })) };
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
  const [connection, setConnection] = useState<"loading" | "online" | "reconnecting" | "offline" | "stale" | "error">("loading");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const stateRef = useRef(state);
  const loadSequence = useRef(0);
  useEffect(() => { stateRef.current = state; }, [state]);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    const client = createSupabaseBrowserClient();
    if (!client) { setError("اتصال امن نامی به سرور تنظیم نشده."); setConnection("error"); setReady(true); return; }
    try {
      const today = tehranDateDaysAgo(0);
      setConnection((current) => current === "loading" ? "loading" : "reconnecting");
      const [statuses, events, entries, settings, log, prefs, signals, profiles, couple, dailyAnswers, pokes, challengeResponses, funPreferences, consents, activities] = await Promise.all([
        client.from("statuses").select("*").eq("couple_id", scope.coupleId),
        client.from("events").select("*").eq("couple_id", scope.coupleId).order("starts_at"),
        client.from("diary_entries").select("*, diary_replies(body, author_id, created_at)").eq("couple_id", scope.coupleId).order("happened_on", { ascending: false }).order("created_at", { ascending: false }),
        client.from("cycle_settings").select("*").eq("user_id", scope.userId).maybeSingle(),
        client.from("cycle_logs").select("*").eq("user_id", scope.userId).order("logged_on", { ascending: false }).limit(1).maybeSingle(),
        client.from("notification_preferences").select("*").eq("user_id", scope.userId).maybeSingle(),
        client.from("intimacy_signals").select("*").eq("couple_id", scope.coupleId).is("withdrawn_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
        client.from("profiles").select("id, display_name, avatar_path, adult_confirmed_at").in("id", [scope.userId, scope.partnerId]),
        client.from("couples").select("relationship_started_on, created_at").eq("id", scope.coupleId).single(),
        client.from("daily_answers").select("id, user_id, answer, reaction, created_at").eq("couple_id", scope.coupleId).eq("prompt_on", today),
        client.from("couple_pokes").select("id, sender_id, kind, message, seen_at, created_at").eq("couple_id", scope.coupleId).gte("created_at", new Date(Date.now() - 86400000).toISOString()).order("created_at", { ascending: false }).limit(20),
        client.from("challenge_responses").select("id, user_id, challenge_key, deck, state, updated_at").eq("couple_id", scope.coupleId).eq("challenge_on", today),
        client.from("fun_preferences").select("user_id, adult_deck_enabled").in("user_id", [scope.userId, scope.partnerId]),
        client.from("feature_consents").select("user_id, feature, accepted_at, revoked_at").in("user_id", [scope.userId, scope.partnerId]),
        client.from("activity_items").select("id, actor_id, activity_type, payload, created_at, activity_reactions(user_id,reaction), activity_replies(id,author_id,body,updated_at)").eq("couple_id", scope.coupleId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30),
      ]);
      if (sequence !== loadSequence.current) return;
      const failed = [statuses, events, entries, settings, log, prefs, signals, profiles, couple, dailyAnswers, pokes, challengeResponses, funPreferences, consents, activities].find((result) => result.error);
      throwIfError(failed?.error as SupabaseError | null, "اطلاعات");
      const own = statuses.data?.find((item) => item.user_id === scope.userId);
      const partner = statuses.data?.find((item) => item.user_id !== scope.userId);
      const cycle = settings.data;
      const daily = log.data;
      const pref = prefs.data;
      const viewerProfile = profiles.data?.find((item) => item.id === scope.userId);
      const partnerProfile = profiles.data?.find((item) => item.id === scope.partnerId);
      const viewerName = viewerProfile?.display_name || scope.viewerName;
      const partnerName = partnerProfile?.display_name || scope.partnerName;
      const [viewerAvatarUrl, partnerAvatarUrl] = await Promise.all([
        signedAvatarUrl(client, viewerProfile?.avatar_path),
        signedAvatarUrl(client, partnerProfile?.avatar_path),
      ]);
      const consented = (userId: string, feature: string) => Boolean(consents.data?.find((item) => item.user_id === userId && item.feature === feature && item.accepted_at && !item.revoked_at));
      const adultConfirmed = consented(scope.userId, "adult_confirmed");
      const bothAdultsConfirmed = adultConfirmed && consented(scope.partnerId, "adult_confirmed");
      const viewerAdultEnabled = consented(scope.userId, "adult_challenges");
      const partnerAdultEnabled = consented(scope.partnerId, "adult_challenges");
      const viewerIntimacyEnabled = consented(scope.userId, "intimacy");
      const partnerIntimacyEnabled = consented(scope.partnerId, "intimacy");
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
          return { id: String(row.id), title: String(row.title), body: String(row.body), date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "long", timeZone: "Asia/Tehran" }).format(new Date(`${row.happened_on}T12:00:00+03:30`)), emoji: String(row.emoji ?? "🤍"), authorId, authorName: authorId === scope.userId ? viewerName : partnerName, reply: reply?.body ? String(reply.body) : undefined, replyAuthorName: replyAuthorId === scope.userId ? viewerName : partnerName };
        }) ?? [],
        cycle: cycle ? { lastPeriodStart: cycle.last_period_start, cycleLength: cycle.cycle_length, periodLength: cycle.period_length, sharedWithPartner: cycle.shared_with_partner, symptoms: daily?.symptoms ?? [], note: daily?.note ?? "" } : null,
        notifications: pref?.status_updates ?? false,
        quietHours: Boolean(pref?.quiet_start),
        intimacy: ownSignal ? signalFromRow(ownSignal as Record<string, unknown>, adultConfirmed) : createDefaultIntimacy(adultConfirmed),
        partnerIntimacy: partnerSignal ? signalFromRow(partnerSignal as Record<string, unknown>, adultConfirmed) : null,
        viewerName,
        partnerName,
        viewerAvatarPath: viewerProfile?.avatar_path ?? null,
        partnerAvatarPath: partnerProfile?.avatar_path ?? null,
        viewerAvatarUrl,
        partnerAvatarUrl,
        relationshipStartedOn: couple.data?.relationship_started_on ?? String(couple.data?.created_at ?? scope.relationshipStartedOn).slice(0, 10),
        dailyAnswers: dailyAnswers.data?.map((row) => ({ id: row.id, userId: row.user_id, answer: row.answer, reaction: row.reaction, createdAt: row.created_at })) ?? [],
        pokes: pokes.data?.map((row) => ({ id: row.id, senderId: row.sender_id, kind: row.kind as PokeKind, message: row.message, seenAt: row.seen_at, createdAt: row.created_at })) ?? [],
        challengeResponses: challengeResponses.data?.map((row) => ({ id: row.id, userId: row.user_id, challengeKey: row.challenge_key, deck: row.deck as ChallengeDeck, state: row.state as ChallengeState, updatedAt: row.updated_at })) ?? [],
        funPreferences: { viewerAdultEnabled, partnerAdultEnabled, bothAdultsConfirmed, adultDeckUnlocked: viewerAdultEnabled && partnerAdultEnabled && bothAdultsConfirmed, viewerIntimacyEnabled, partnerIntimacyEnabled, intimacyUnlocked: viewerIntimacyEnabled && partnerIntimacyEnabled && bothAdultsConfirmed },
        activities: activities.data?.map((row) => activityFromRow(row as Record<string, unknown>)) ?? [],
      }));
      setHasMoreActivities((activities.data?.length ?? 0) === 30);
      const syncedAt = new Date().toISOString();
      setLastSyncedAt(syncedAt);
      setConnection("online");
      const safeActivities: ActivityItem[] = activities.data?.slice(0, 10).map((row) => ({ id: String(row.id), actorId: String(row.actor_id), type: row.activity_type as ActivityType, payload: (row.payload ?? {}) as Record<string, string | boolean | null>, createdAt: String(row.created_at), reactions: [], replies: [] })) ?? [];
      void saveSafeSnapshot({ coupleId: scope.coupleId, partnerName, partnerMood: partner ? { emoji: partner.mood_emoji, label: partner.mood } : null, partnerActivity: partner?.activity ?? null, relationshipStartedOn: couple.data?.relationship_started_on ?? String(couple.data?.created_at ?? scope.relationshipStartedOn).slice(0, 10), events: events.data?.map((row) => eventFromRow(row as Record<string, unknown>)) ?? [], activities: safeActivities, savedAt: syncedAt }).catch(() => undefined);
      setError(null);
    } catch (loadError) {
      console.error("[Nami] load", loadError);
      const snapshot = await readSafeSnapshot(scope.coupleId).catch(() => null);
      if (snapshot) {
        setState((current) => ({ ...current, partnerName: snapshot.partnerName, partnerMood: snapshot.partnerMood, partnerActivity: snapshot.partnerActivity, relationshipStartedOn: snapshot.relationshipStartedOn, events: snapshot.events.map((event) => ({ ...event, isPast: event.startsAt ? new Date(event.startsAt).getTime() < Date.now() : false })), activities: snapshot.activities ?? [] }));
        setLastSyncedAt(snapshot.savedAt);
        setConnection("stale");
        setError(null);
      } else {
        setConnection(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
        setError(loadError instanceof Error ? loadError.message : "اطلاعات از سرور دریافت نشد.");
      }
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
      .on("postgres_changes", { event: "*", schema: "public", table: "statuses", filter: `couple_id=eq.${scope.coupleId}` }, (payload) => { const row = payload.new as Record<string, unknown>; if (row.user_id && row.user_id !== scope.userId) notifyPartnerUpdate("یه آپدیت تازه توی نامی 💜", `${stateRef.current.partnerName} حال‌وهوایش را به‌روز کرد.`); reload(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `couple_id=eq.${scope.coupleId}` }, (payload) => { const row = payload.new as Record<string, unknown>; if (row.created_by && row.created_by !== scope.userId) notifyPartnerUpdate("یه پلن تازه دارین 📅", `${stateRef.current.partnerName} تقویم دوتایی‌تون را به‌روز کرد.`); reload(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "diary_entries", filter: `couple_id=eq.${scope.coupleId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "intimacy_signals", filter: `couple_id=eq.${scope.coupleId}` }, (payload) => { const row = payload.new as Record<string, unknown>; if (row.sender_id && row.sender_id !== scope.userId) notifyPartnerUpdate("یه پیام خصوصی توی نامی داری 🔒", `${stateRef.current.partnerName} یه سیگنال دوتایی فرستاده.`); reload(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_answers", filter: `couple_id=eq.${scope.coupleId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "couple_pokes", filter: `couple_id=eq.${scope.coupleId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "challenge_responses", filter: `couple_id=eq.${scope.coupleId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_items", filter: `couple_id=eq.${scope.coupleId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_reactions" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_replies" }, reload)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${scope.userId}` }, reload)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${scope.partnerId}` }, reload)
      .subscribe((status, channelError) => { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.error("[Nami] realtime", status, channelError); });
    const privateChannel = client.channel(`user-${scope.userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cycle_settings", filter: `user_id=eq.${scope.userId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "cycle_logs", filter: `user_id=eq.${scope.userId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_preferences", filter: `user_id=eq.${scope.userId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "fun_preferences", filter: `user_id=eq.${scope.userId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "fun_preferences", filter: `user_id=eq.${scope.partnerId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "feature_consents", filter: `user_id=eq.${scope.userId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "feature_consents", filter: `user_id=eq.${scope.partnerId}` }, reload)
      .subscribe((status, channelError) => {
        if (status === "SUBSCRIBED") setConnection("online");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") { setConnection("reconnecting"); console.error("[Nami] realtime", status, channelError); }
      });
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
        const cycleResult = await client.rpc("save_cycle_state", { last_period_start: patch.cycle.lastPeriodStart, cycle_length: patch.cycle.cycleLength, period_length: patch.cycle.periodLength, symptoms: patch.cycle.symptoms, note: patch.cycle.note, shared_with_partner: patch.cycle.sharedWithPartner, logged_on: tehranDateDaysAgo(0) });
        throwIfError(cycleResult.error, "وضعیت چرخه");
      }
      if (patch.intimacy) {
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

  const updateProfile = useCallback(async (displayName: string, avatarFile?: File | null) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const cleanName = displayName.trim();
    if (!cleanName || cleanName.length > 60) throw new Error("اسم باید بین ۱ تا ۶۰ کاراکتر باشه.");
    let uploadedPath: string | null = null;
    try {
      if (avatarFile) {
        const allowedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
        const extension = allowedTypes.get(avatarFile.type);
        if (!extension) throw new Error("عکس باید JPG، PNG یا WebP باشه.");
        if (avatarFile.size > 5 * 1024 * 1024) throw new Error("حجم عکس باید کمتر از ۵ مگابایت باشه.");
        uploadedPath = `${scope.userId}/${crypto.randomUUID()}.${extension}`;
        const uploadResult = await client.storage.from("profile-avatars").upload(uploadedPath, avatarFile, { contentType: avatarFile.type, cacheControl: "3600", upsert: false });
        if (uploadResult.error) { console.error("[Nami] avatar upload", uploadResult.error); throw new Error("آپلود عکس انجام نشد؛ دوباره امتحان کن."); }
      }
      const profileResult = await client.from("profiles").update({ display_name: cleanName, ...(uploadedPath ? { avatar_path: uploadedPath } : {}) }).eq("id", scope.userId);
      throwIfError(profileResult.error, "پروفایل");
      if (uploadedPath && stateRef.current.viewerAvatarPath && stateRef.current.viewerAvatarPath !== uploadedPath) {
        const removal = await client.storage.from("profile-avatars").remove([stateRef.current.viewerAvatarPath]);
        if (removal.error) console.error("[Nami] old avatar cleanup", removal.error);
      }
      await load();
    } catch (profileError) {
      if (uploadedPath) await client.storage.from("profile-avatars").remove([uploadedPath]);
      throw profileError instanceof Error ? profileError : new Error("پروفایل ذخیره نشد؛ دوباره امتحان کن.");
    }
  }, [scope, load]);

  const answerDaily = useCallback(async (promptKey: string, answer: string) => {
    const client = createSupabaseBrowserClient();
    const cleanAnswer = answer.trim();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    if (!cleanAnswer || cleanAnswer.length > 500) throw new Error("جوابت باید بین ۱ تا ۵۰۰ کاراکتر باشه.");
    const isFirstAnswer = !stateRef.current.dailyAnswers.some((item) => item.userId === scope.userId);
    const result = await client.from("daily_answers").upsert({
      couple_id: scope.coupleId,
      prompt_on: tehranDateDaysAgo(0),
      prompt_key: promptKey,
      user_id: scope.userId,
      answer: cleanAnswer,
      updated_at: new Date().toISOString(),
    }, { onConflict: "couple_id,prompt_on,user_id" }).select("id").single();
    throwIfError(result.error, "جواب امروز");
    await load();
    if (isFirstAnswer && result.data?.id) void sendFunPush("daily_answer", result.data.id);
  }, [scope, load]);

  const reactToDaily = useCallback(async (reaction: string) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const result = await client.from("daily_answers").update({ reaction, updated_at: new Date().toISOString() }).eq("couple_id", scope.coupleId).eq("prompt_on", tehranDateDaysAgo(0)).eq("user_id", scope.userId);
    throwIfError(result.error, "ری‌اکشن");
    await load();
  }, [scope, load]);

  const sendPoke = useCallback(async (kind: PokeKind, message: string) => {
    const client = createSupabaseBrowserClient();
    const cleanMessage = message.trim();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    if (cleanMessage.length > 80) throw new Error("پیام تلنگر باید حداکثر ۸۰ کاراکتر باشه.");
    const result = await client.from("couple_pokes").insert({ couple_id: scope.coupleId, sender_id: scope.userId, kind, message: cleanMessage }).select("id").single();
    throwIfError(result.error, "تلنگر");
    await load();
    if (result.data?.id) void sendFunPush("poke", result.data.id);
  }, [scope, load]);

  const markPokesSeen = useCallback(async () => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    const ids = stateRef.current.pokes.filter((poke) => poke.senderId !== scope.userId && !poke.seenAt).map((poke) => poke.id);
    if (!ids.length) return;
    const result = await client.from("couple_pokes").update({ seen_at: new Date().toISOString() }).in("id", ids);
    throwIfError(result.error, "تلنگرها");
    await load();
  }, [scope.userId, load]);

  const setChallengeState = useCallback(async (challengeKey: string, deck: ChallengeDeck, challengeState: ChallengeState) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const result = await client.from("challenge_responses").upsert({
      couple_id: scope.coupleId,
      challenge_on: tehranDateDaysAgo(0),
      challenge_key: challengeKey,
      deck,
      user_id: scope.userId,
      state: challengeState,
      updated_at: new Date().toISOString(),
    }, { onConflict: "couple_id,challenge_on,challenge_key,user_id" }).select("id").single();
    throwIfError(result.error, "چالش");
    await load();
    if (result.data?.id) void sendFunPush("challenge", result.data.id);
  }, [scope, load]);

  const setAdultFun = useCallback(async (enabled: boolean) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const now = new Date().toISOString();
    if (enabled) {
      const adult = await client.from("feature_consents").upsert({ user_id: scope.userId, feature: "adult_confirmed", accepted_at: now, revoked_at: null, updated_at: now });
      throwIfError(adult.error, "تأیید سن");
    }
    const consent = await client.from("feature_consents").upsert({ user_id: scope.userId, feature: "adult_challenges", accepted_at: enabled ? now : null, revoked_at: enabled ? null : now, updated_at: now });
    throwIfError(consent.error, "رضایت بازی");
    const result = await client.from("fun_preferences").upsert({ user_id: scope.userId, adult_deck_enabled: enabled, updated_at: new Date().toISOString() });
    throwIfError(result.error, "تنظیمات بازی");
    await load();
  }, [scope.userId, load]);

  const setIntimacyConsent = useCallback(async (enabled: boolean) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const now = new Date().toISOString();
    if (enabled) {
      const adult = await client.from("feature_consents").upsert({ user_id: scope.userId, feature: "adult_confirmed", accepted_at: now, revoked_at: null, updated_at: now });
      throwIfError(adult.error, "تأیید سن");
    }
    const consent = await client.from("feature_consents").upsert({ user_id: scope.userId, feature: "intimacy", accepted_at: enabled ? now : null, revoked_at: enabled ? null : now, updated_at: now });
    throwIfError(consent.error, "رضایت فضای خصوصی");
    await load();
  }, [scope.userId, load]);

  const reactToActivity = useCallback(async (activityId: string, reaction: string) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const existing = stateRef.current.activities.find((item) => item.id === activityId)?.reactions.find((item) => item.userId === scope.userId);
    const result = existing?.reaction === reaction
      ? await client.from("activity_reactions").delete().eq("activity_id", activityId).eq("user_id", scope.userId)
      : await client.from("activity_reactions").upsert({ activity_id: activityId, user_id: scope.userId, reaction, updated_at: new Date().toISOString() });
    throwIfError(result.error, "واکنش");
    await load();
  }, [scope.userId, load]);

  const replyToActivity = useCallback(async (activityId: string, body: string) => {
    const client = createSupabaseBrowserClient();
    const cleanBody = body.trim();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    if (!cleanBody || cleanBody.length > 280) throw new Error("جواب باید بین ۱ تا ۲۸۰ کاراکتر باشه.");
    const result = await client.from("activity_replies").upsert({ activity_id: activityId, author_id: scope.userId, body: cleanBody, updated_at: new Date().toISOString() }, { onConflict: "activity_id,author_id" });
    throwIfError(result.error, "جواب");
    await load();
  }, [scope.userId, load]);

  const loadOlderActivities = useCallback(async () => {
    const client = createSupabaseBrowserClient();
    const last = stateRef.current.activities.at(-1);
    if (!client || !last) return;
    const result = await client.from("activity_items").select("id, actor_id, activity_type, payload, created_at, activity_reactions(user_id,reaction), activity_replies(id,author_id,body,updated_at)").eq("couple_id", scope.coupleId).lt("created_at", last.createdAt).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(30);
    throwIfError(result.error, "ادامه تازه‌ها");
    const older = result.data?.map((row) => activityFromRow(row as Record<string, unknown>)) ?? [];
    setState((current) => ({ ...current, activities: [...current.activities, ...older.filter((item) => !current.activities.some((currentItem) => currentItem.id === item.id))] }));
    setHasMoreActivities(older.length === 30);
  }, [scope.coupleId]);

  const saveEvent = useCallback(async (event: EventItem) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const result = await client.from("events").update({ title: event.title, starts_at: event.startsAt, reminder_offsets: [reminderMinutes.get(event.reminder) ?? 1440] }).eq("id", event.id).eq("couple_id", scope.coupleId);
    throwIfError(result.error, "برنامه");
    await load();
  }, [scope.coupleId, load]);

  const deleteEvent = useCallback(async (eventId: string) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const result = await client.from("events").delete().eq("id", eventId).eq("couple_id", scope.coupleId);
    throwIfError(result.error, "برنامه");
    await load();
  }, [scope.coupleId, load]);

  const saveMemory = useCallback(async (memory: MemoryItem) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const result = await client.from("diary_entries").update({ title: memory.title, body: memory.body, emoji: memory.emoji, updated_at: new Date().toISOString() }).eq("id", memory.id).eq("author_id", scope.userId);
    throwIfError(result.error, "خاطره");
    await load();
  }, [scope.userId, load]);

  const deleteMemory = useCallback(async (memoryId: string) => {
    const client = createSupabaseBrowserClient();
    if (!client) throw new Error("اتصال امن نامی به سرور تنظیم نشده.");
    const result = await client.from("diary_entries").delete().eq("id", memoryId).eq("author_id", scope.userId);
    throwIfError(result.error, "خاطره");
    await load();
  }, [scope.userId, load]);

  return { state, update, updateProfile, answerDaily, reactToDaily, sendPoke, markPokesSeen, setChallengeState, setAdultFun, setIntimacyConsent, reactToActivity, replyToActivity, loadOlderActivities, saveEvent, deleteEvent, saveMemory, deleteMemory, ready, error, connection, lastSyncedAt, hasMoreActivities, reload: load };
}
