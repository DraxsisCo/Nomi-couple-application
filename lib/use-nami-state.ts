"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CycleState, EventItem, INITIAL_EVENTS, INITIAL_MEMORIES, IntimacyState, MemoryItem } from "./types";
import { createSupabaseBrowserClient } from "./supabase/client";

const KEY = "nami-demo-state-v1";
export type ProductionScope = { userId: string; coupleId: string; viewerName: string; partnerName: string };
export type NamiState = { onboarded: boolean; mood: { emoji: string; label: string }; activity: string; partnerMood: { emoji: string; label: string }; partnerActivity: string; events: EventItem[]; memories: MemoryItem[]; notifications: boolean; quietHours: boolean; cycle: CycleState; intimacy: IntimacyState };

function tehranDateDaysAgo(days: number) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const date = new Date(get("year"), get("month") - 1, get("day") - days, 12);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function createDefaultCycle(): CycleState { return { lastPeriodStart: tehranDateDaysAgo(10), cycleLength: 28, periodLength: 5, symptoms: ["انرژی خوب"], note: "", sharedWithPartner: true }; }
export function createDefaultIntimacy(): IntimacyState { return { adultConfirmed: false, signal: null, emoji: null, message: "", sentAt: null, expiresAt: null }; }
const initial: NamiState = { onboarded: false, mood: { emoji: "😊", label: "خوشحال" }, activity: "مشغول کار", partnerMood: { emoji: "🥰", label: "عاشق" }, partnerActivity: "وقت آزاد", events: INITIAL_EVENTS, memories: INITIAL_MEMORIES, notifications: false, quietHours: true, cycle: createDefaultCycle(), intimacy: createDefaultIntimacy() };
function migrate(saved: Partial<NamiState>): NamiState { return { ...initial, ...saved, cycle: { ...createDefaultCycle(), ...(saved.cycle ?? {}) }, intimacy: { ...createDefaultIntimacy(), ...(saved.intimacy ?? {}) } }; }

function eventFromRow(row: Record<string, unknown>): EventItem {
  const date = new Date(String(row.starts_at));
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: "Asia/Tehran", day: "numeric", month: "long" }).formatToParts(date);
  const faDigits = "۰۱۲۳۴۵۶۷۸۹"; const rawDay = parts.find((part) => part.type === "day")?.value || "1";
  const day = Number(rawDay.replace(/[۰-۹]/g, (digit) => String(faDigits.indexOf(digit))));
  const time = new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return { id: String(row.id), title: String(row.title), day, month: parts.find((part) => part.type === "month")?.value || "", time: row.all_day ? "تمام روز" : time, daysLeft: Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000)), reminder: "یک روز قبل", startsAt: date.toISOString() };
}

export function useNamiState(scope?: ProductionScope) {
  const [state, setState] = useState<NamiState>(scope ? { ...initial, onboarded: true, events: [], memories: [] } : initial);
  const [ready, setReady] = useState(false); const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const load = useCallback(async () => {
    if (!scope) return; const client = createSupabaseBrowserClient(); if (!client) return;
    const [statuses, events, entries, settings, log, prefs, signal] = await Promise.all([
      client.from("statuses").select("*").eq("couple_id", scope.coupleId), client.from("events").select("*").eq("couple_id", scope.coupleId).order("starts_at"), client.from("diary_entries").select("*").eq("couple_id", scope.coupleId).order("happened_on", { ascending: false }), client.from("cycle_settings").select("*").eq("user_id", scope.userId).maybeSingle(), client.from("cycle_logs").select("*").eq("user_id", scope.userId).order("logged_on", { ascending: false }).limit(1).maybeSingle(), client.from("notification_preferences").select("*").eq("user_id", scope.userId).maybeSingle(), client.from("intimacy_signals").select("*").eq("couple_id", scope.coupleId).eq("sender_id", scope.userId).is("withdrawn_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const own = statuses.data?.find((item) => item.user_id === scope.userId); const partner = statuses.data?.find((item) => item.user_id !== scope.userId); const cycle = settings.data; const daily = log.data; const pref = prefs.data; const intimate = signal.data;
    setState((current) => ({ ...current, onboarded: true, mood: own ? { emoji: own.mood_emoji, label: own.mood } : current.mood, activity: own?.activity || current.activity, partnerMood: partner ? { emoji: partner.mood_emoji, label: partner.mood } : current.partnerMood, partnerActivity: partner?.activity || current.partnerActivity, events: events.data?.map((row) => eventFromRow(row as Record<string, unknown>)) ?? [], memories: entries.data?.map((row) => ({ id: row.id, title: row.title, body: row.body, date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "long", timeZone: "Asia/Tehran" }).format(new Date(`${row.happened_on}T12:00:00+03:30`)), emoji: "🤍" })) ?? [], cycle: cycle ? { lastPeriodStart: cycle.last_period_start, cycleLength: cycle.cycle_length, periodLength: cycle.period_length, sharedWithPartner: cycle.shared_with_partner, symptoms: daily?.symptoms ?? [], note: daily?.note ?? "" } : current.cycle, notifications: pref?.status_updates ?? false, quietHours: Boolean(pref?.quiet_start), intimacy: intimate ? { adultConfirmed: true, signal: intimate.signal, emoji: intimate.emoji, message: intimate.message, sentAt: intimate.created_at, expiresAt: intimate.expires_at } : { ...current.intimacy, signal: null, expiresAt: null } }));
    setReady(true);
  }, [scope]);

  useEffect(() => { if (scope) { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); } try { const saved = localStorage.getItem(KEY); if (saved) {
    // Browser-only demo hydration intentionally happens after the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(migrate(JSON.parse(saved) as Partial<NamiState>));
  } } catch { /* defaults */ } setReady(true); }, [scope, load]);
  useEffect(() => { if (!scope && ready) localStorage.setItem(KEY, JSON.stringify(state)); }, [ready, scope, state]);
  useEffect(() => { if (!scope) return; const client = createSupabaseBrowserClient(); if (!client) return; const channel = client.channel(`couple-${scope.coupleId}`).on("postgres_changes", { event: "*", schema: "public", table: "statuses", filter: `couple_id=eq.${scope.coupleId}` }, () => void load()).on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `couple_id=eq.${scope.coupleId}` }, () => void load()).on("postgres_changes", { event: "*", schema: "public", table: "diary_entries", filter: `couple_id=eq.${scope.coupleId}` }, () => void load()).subscribe(); return () => { void client.removeChannel(channel); }; }, [scope, load]);

  const update = useCallback((patch: Partial<NamiState>) => {
    const previous = stateRef.current; setState((current) => ({ ...current, ...patch })); if (!scope) return; const client = createSupabaseBrowserClient(); if (!client) return;
    void (async () => {
      if (patch.mood || patch.activity) await client.from("statuses").upsert({ user_id: scope.userId, couple_id: scope.coupleId, mood: patch.mood?.label ?? previous.mood.label, mood_emoji: patch.mood?.emoji ?? previous.mood.emoji, activity: patch.activity ?? previous.activity, updated_at: new Date().toISOString() });
      if (patch.events) { const added = patch.events.find((item) => !previous.events.some((old) => old.id === item.id)); if (added) await client.from("events").insert({ id: added.id, couple_id: scope.coupleId, created_by: scope.userId, title: added.title, starts_at: added.startsAt ?? new Date().toISOString(), reminder_offsets: [1440] }); }
      if (patch.memories) { const added = patch.memories.find((item) => !previous.memories.some((old) => old.id === item.id)); if (added) await client.from("diary_entries").insert({ id: added.id, couple_id: scope.coupleId, author_id: scope.userId, title: added.title, body: added.body, happened_on: tehranDateDaysAgo(0) }); }
      if (patch.cycle) { await client.from("cycle_settings").upsert({ user_id: scope.userId, last_period_start: patch.cycle.lastPeriodStart, cycle_length: patch.cycle.cycleLength, period_length: patch.cycle.periodLength, shared_with_partner: patch.cycle.sharedWithPartner, updated_at: new Date().toISOString() }); await client.from("cycle_logs").upsert({ user_id: scope.userId, logged_on: tehranDateDaysAgo(0), symptoms: patch.cycle.symptoms, note: patch.cycle.note, updated_at: new Date().toISOString() }, { onConflict: "user_id,logged_on" }); }
      if (patch.intimacy) { if (patch.intimacy.adultConfirmed) await client.from("profiles").update({ adult_confirmed_at: new Date().toISOString() }).eq("id", scope.userId); if (patch.intimacy.signal) await client.from("intimacy_signals").insert({ couple_id: scope.coupleId, sender_id: scope.userId, signal: patch.intimacy.signal, emoji: patch.intimacy.emoji, message: patch.intimacy.message, expires_at: patch.intimacy.expiresAt }); else await client.from("intimacy_signals").update({ withdrawn_at: new Date().toISOString() }).eq("sender_id", scope.userId).is("withdrawn_at", null); }
      if (patch.notifications !== undefined || patch.quietHours !== undefined) await client.from("notification_preferences").upsert({ user_id: scope.userId, status_updates: patch.notifications ?? previous.notifications, quiet_start: (patch.quietHours ?? previous.quietHours) ? "23:00" : null, quiet_end: (patch.quietHours ?? previous.quietHours) ? "08:00" : null, timezone: "Asia/Tehran", updated_at: new Date().toISOString() });
    })();
  }, [scope]);
  return { state, update, ready };
}
