import { createAdminClient } from "@/lib/supabase/admin";

export async function notifyUser(input: {
  userId: string;
  tipe: string;
  judul: string;
  pesan: string;
  linkPath?: string;
}) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: input.userId,
    tipe: input.tipe,
    judul: input.judul,
    pesan: input.pesan,
    link_path: input.linkPath ?? null,
  });
}

export async function notifyUsers(
  userIds: string[],
  input: { tipe: string; judul: string; pesan: string; linkPath?: string },
) {
  if (userIds.length === 0) return;
  const admin = createAdminClient();
  await admin.from("notifications").insert(
    userIds.map((userId) => ({
      user_id: userId,
      tipe: input.tipe,
      judul: input.judul,
      pesan: input.pesan,
      link_path: input.linkPath ?? null,
    })),
  );
}
