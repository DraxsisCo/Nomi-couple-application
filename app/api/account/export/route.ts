import { createSupabaseServerClient } from "@/lib/supabase/server";
import { privateJson } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client) return privateJson({ error: "not_configured" }, { status: 503 });
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return privateJson({ error: "unauthorized" }, { status: 401 });

  const { data: membership } = await client
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const coupleId = membership?.couple_id;
  const [profile, consents, notificationPreferences, cycleSettings, cycleLogs, couple, statuses, events, diaryEntries, pokes, dailyAnswers, challenges, activities] = await Promise.all([
    client.from("profiles").select("display_name, avatar_path, created_at").eq("id", auth.user.id).maybeSingle(),
    client.from("feature_consents").select("feature, accepted_at, revoked_at, updated_at").eq("user_id", auth.user.id),
    client.from("notification_preferences").select("*").eq("user_id", auth.user.id).maybeSingle(),
    client.from("cycle_settings").select("*").eq("user_id", auth.user.id).maybeSingle(),
    client.from("cycle_logs").select("*").eq("user_id", auth.user.id).order("logged_on"),
    coupleId ? client.from("couples").select("id, relationship_started_on, created_at").eq("id", coupleId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    coupleId ? client.from("statuses").select("*").eq("couple_id", coupleId) : Promise.resolve({ data: [], error: null }),
    coupleId ? client.from("events").select("*").eq("couple_id", coupleId).order("starts_at") : Promise.resolve({ data: [], error: null }),
    coupleId ? client.from("diary_entries").select("*, diary_replies(*)").eq("couple_id", coupleId).order("happened_on") : Promise.resolve({ data: [], error: null }),
    coupleId ? client.from("couple_pokes").select("*").eq("couple_id", coupleId).order("created_at") : Promise.resolve({ data: [], error: null }),
    coupleId ? client.from("daily_answers").select("*").eq("couple_id", coupleId).order("prompt_on") : Promise.resolve({ data: [], error: null }),
    coupleId ? client.from("challenge_responses").select("*").eq("couple_id", coupleId).order("challenge_on") : Promise.resolve({ data: [], error: null }),
    coupleId ? client.from("activity_items").select("*, activity_reactions(*), activity_replies(*)").eq("couple_id", coupleId).order("created_at") : Promise.resolve({ data: [], error: null }),
  ]);

  const failed = [profile, consents, notificationPreferences, cycleSettings, cycleLogs, couple, statuses, events, diaryEntries, pokes, dailyAnswers, challenges, activities].find((result) => result.error);
  if (failed?.error) return privateJson({ error: "export_failed" }, { status: 500 });

  return privateJson({
    exportedAt: new Date().toISOString(),
    account: { id: auth.user.id, email: auth.user.email, profile: profile.data },
    privacy: { consents: consents.data, notifications: notificationPreferences.data },
    cycle: { settings: cycleSettings.data, logs: cycleLogs.data },
    couple: couple.data,
    shared: {
      statuses: statuses.data,
      events: events.data,
      diaryEntries: diaryEntries.data,
      pokes: pokes.data,
      dailyAnswers: dailyAnswers.data,
      challenges: challenges.data,
      activities: activities.data,
    },
  }, {
    headers: { "Content-Disposition": `attachment; filename="nami-export-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}
