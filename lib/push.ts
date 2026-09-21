import { createSupabaseBrowserClient } from "./supabase/client";

function vapidKeyBytes(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(base64);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

export async function registerPushSubscription(userId: string) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const client = createSupabaseBrowserClient();
  if (!publicKey || !client || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKeyBytes(publicKey),
  });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("مرورگرت نتونست اعلان امن بسازه.");
  const result = await client.from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    user_agent: navigator.userAgent,
  }, { onConflict: "endpoint" });
  if (result.error) throw result.error;
  return true;
}

export async function sendFunPush(eventType: "poke" | "daily_answer" | "challenge", resourceId: string) {
  const response = await fetch("/api/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, resourceId }),
  });
  if (!response.ok && response.status !== 503) console.error("[Nami] push send", await response.text());
}
