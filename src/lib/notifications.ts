import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPushToUser, sendWebPushToUsers } from "@/lib/push";

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

  void sendWebPushToUser(input.userId, {
    title: input.judul,
    body: input.pesan,
    url: input.linkPath || "/notifikasi",
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

  void sendWebPushToUsers(userIds, {
    title: input.judul,
    body: input.pesan,
    url: input.linkPath || "/notifikasi",
  });
}
