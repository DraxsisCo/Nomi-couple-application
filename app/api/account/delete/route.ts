import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSameOriginRequest, privateJson } from "@/lib/security";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return privateJson({ error: "invalid_origin" }, { status: 403 });
  if (request.headers.get("x-nami-confirm") !== "DELETE") return privateJson({ error: "confirmation_required" }, { status: 400 });

  const client = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!client || !admin) return privateJson({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await client.auth.getUser();
  if (!auth.user) return privateJson({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await admin.from("profiles").select("avatar_path").eq("id", auth.user.id).maybeSingle();
  const { data: entries } = await admin.from("diary_entries").select("id").eq("author_id", auth.user.id);
  const entryIds = entries?.map((entry) => entry.id) ?? [];
  const { data: photos } = entryIds.length
    ? await admin.from("diary_photos").select("storage_path").in("entry_id", entryIds)
    : { data: [] as { storage_path: string }[] };

  if (photos?.length) await admin.storage.from("diary-photos").remove(photos.map((photo) => photo.storage_path));
  if (profile?.avatar_path) await admin.storage.from("profile-avatars").remove([profile.avatar_path]);

  const { error: leaveError } = await client.rpc("leave_couple");
  if (leaveError) return privateJson({ error: "unpair_failed" }, { status: 500 });

  const { error: deleteError } = await admin.auth.admin.deleteUser(auth.user.id);
  if (deleteError) return privateJson({ error: "account_delete_failed" }, { status: 500 });

  return privateJson({ deleted: true });
}
