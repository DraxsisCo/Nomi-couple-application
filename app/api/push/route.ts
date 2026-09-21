import webPush from "web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isQuietNow } from "@/lib/date-time";
import { isSameOriginRequest, privateJson } from "@/lib/security";

export const runtime = "nodejs";

type PushEvent = "poke" | "daily_answer" | "challenge";

export async function POST(request: Request) {
  const client = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "https://nomi-chi-gilt.vercel.app";
  if (!isSameOriginRequest(request)) return privateJson({ error: "invalid_origin" }, { status: 403 });
  if (!client || !admin || !publicKey || !privateKey || !subject) return privateJson({ error: "push_not_configured" }, { status: 503 });

  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return privateJson({ error: "unauthorized" }, { status: 401 });

  let body: { eventType?: PushEvent; resourceId?: string };
  try { body = await request.json(); }
  catch { return privateJson({ error: "invalid_json" }, { status: 400 }); }
  if (!body.resourceId || !["poke", "daily_answer", "challenge"].includes(body.eventType ?? "")) return privateJson({ error: "invalid_request" }, { status: 400 });

  const { data: membership } = await admin.from("couple_members").select("couple_id").eq("user_id", auth.user.id).maybeSingle();
  if (!membership) return privateJson({ error: "not_paired" }, { status: 403 });
  const { data: partner } = await admin.from("couple_members").select("user_id").eq("couple_id", membership.couple_id).neq("user_id", auth.user.id).maybeSingle();
  if (!partner) return privateJson({ error: "partner_missing" }, { status: 409 });

  let title = "یه چیز تازه توی نامی داری 💜";
  let message = "پارتنرت یه سورپرایز کوچیک برات گذاشته.";
  let tag = "nami-spark";
  if (body.eventType === "poke") {
    const { data } = await admin.from("couple_pokes").select("id").eq("id", body.resourceId).eq("couple_id", membership.couple_id).eq("sender_id", auth.user.id).maybeSingle();
    if (!data) return privateJson({ error: "invalid_resource" }, { status: 403 });
    title = "یه تلنگر بانمک داری 💜"; message = "بیا نامی رو باز کن؛ یکی یاد تو بوده."; tag = `nami-poke-${data.id}`;
  } else if (body.eventType === "daily_answer") {
    const { data } = await admin.from("daily_answers").select("id, prompt_on, prompt_key").eq("id", body.resourceId).eq("couple_id", membership.couple_id).eq("user_id", auth.user.id).maybeSingle();
    if (!data) return privateJson({ error: "invalid_resource" }, { status: 403 });
    const { count } = await admin.from("daily_answers").select("id", { count: "exact", head: true }).eq("couple_id", membership.couple_id).eq("prompt_on", data.prompt_on).eq("prompt_key", data.prompt_key);
    title = count === 2 ? "جواب‌های امروز باز شدن ✨" : "سؤال امروز منتظرته 👀";
    message = count === 2 ? "هر دوتون جواب دادین؛ وقتشه جواب‌ها رو ببینین." : "پارتنرت جواب داده؛ نوبت توئه.";
    tag = `nami-answer-${data.prompt_on}`;
  } else {
    const { data } = await admin.from("challenge_responses").select("id, deck").eq("id", body.resourceId).eq("couple_id", membership.couple_id).eq("user_id", auth.user.id).maybeSingle();
    if (!data) return privateJson({ error: "invalid_resource" }, { status: 403 });
    title = "چالش دوتایی‌تون آپدیت شد 🎯"; message = "یه حرکت تازه توی چالش امروز دارین."; tag = `nami-challenge-${data.id}`;
  }

  const { error: deliveryError } = await admin.from("notification_deliveries").insert({
    event_type: body.eventType,
    resource_id: body.resourceId,
    recipient_id: partner.user_id,
  });
  if (deliveryError?.code === "23505") return privateJson({ sent: 0, duplicate: true });
  if (deliveryError) return privateJson({ error: "delivery_reservation_failed" }, { status: 503 });

  const { data: preference } = await admin.from("notification_preferences").select("fun_updates, quiet_start, quiet_end, timezone").eq("user_id", partner.user_id).maybeSingle();
  if (preference?.fun_updates === false || isQuietNow(preference?.quiet_start ?? null, preference?.quiet_end ?? null, preference?.timezone || "Asia/Tehran")) return privateJson({ sent: 0, skipped: true });

  const { data: subscriptions } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", partner.user_id);
  if (!subscriptions?.length) return privateJson({ sent: 0 });
  webPush.setVapidDetails(subject, publicKey, privateKey);
  const expired: string[] = [];
  let sent = 0;
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title, body: message, tag, url: "/?spark=1" }));
      sent += 1;
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) expired.push(subscription.endpoint);
      else console.error("[Nami] push delivery", error);
    }
  }));
  if (expired.length) await admin.from("push_subscriptions").delete().in("endpoint", expired);
  return privateJson({ sent });
}
