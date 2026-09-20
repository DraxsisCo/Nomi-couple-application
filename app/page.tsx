import { CouplesApp } from "@/components/couples-app";
import { PairingScreen } from "@/components/pairing-screen";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return <CouplesApp />;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", auth.user.id).maybeSingle(),
    supabase.from("couple_members").select("couple_id").eq("user_id", auth.user.id).maybeSingle(),
  ]);
  const viewerName = profile?.display_name || auth.user.email?.split("@")[0] || "تو";
  if (!membership) return <PairingScreen name={viewerName} />;
  const { data: members } = await supabase.from("couple_members").select("user_id, profiles(display_name)").eq("couple_id", membership.couple_id);
  const partner = members?.find((member) => member.user_id !== auth.user.id);
  const partnerProfile = partner?.profiles as unknown as { display_name?: string } | null;
  return <CouplesApp production={{ userId: auth.user.id, coupleId: membership.couple_id, viewerName, partnerName: partnerProfile?.display_name || "همراهت" }} />;
}
