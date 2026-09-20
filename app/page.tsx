import { CouplesApp } from "@/components/couples-app";
import { PairingScreen } from "@/components/pairing-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <main className="welcome"><section className="welcome-card"><h1>اتصال نامی کامل نیست</h1><p className="muted">متغیرهای Supabase روی سرور تنظیم نشده‌اند.</p></section></main>;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) redirect("/login");
  if (!auth.user) redirect("/login");
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", auth.user.id).maybeSingle(),
    supabase.from("couple_members").select("couple_id").eq("user_id", auth.user.id).maybeSingle(),
  ]);
  const viewerName = profile?.display_name || auth.user.email?.split("@")[0] || "تو";
  if (!membership) return <PairingScreen name={viewerName} />;
  const [{ data: members }, { data: couple }] = await Promise.all([
    supabase.from("couple_members").select("user_id, profiles(display_name)").eq("couple_id", membership.couple_id),
    supabase.from("couples").select("relationship_started_on, created_at").eq("id", membership.couple_id).single(),
  ]);
  const partner = members?.find((member) => member.user_id !== auth.user.id);
  if (!partner) return <PairingScreen name={viewerName} />;
  const partnerProfile = partner?.profiles as unknown as { display_name?: string } | null;
  const relationshipStartedOn = couple?.relationship_started_on || couple?.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10);
  return <CouplesApp production={{ userId: auth.user.id, coupleId: membership.couple_id, viewerName, partnerName: partnerProfile?.display_name || "همراهت", relationshipStartedOn }} />;
}
