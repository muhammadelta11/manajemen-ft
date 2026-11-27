"use server";

import { requireUser } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVapidPublicKey, pushConfigured } from "@/lib/push";

export async function getPushPublicKeyAction() {
  return {
    configured: pushConfigured(),
    publicKey: getVapidPublicKey(),
  };
}

export async function savePushSubscriptionAction(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) {
  const user = await requireUser();
  if (!input.endpoint || !input.p256dh || !input.auth) {
    return { error: "Subscription tidak lengkap." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent?.slice(0, 500) ?? null,
    },
    { onConflict: "endpoint" },
  );

  if (error) return { error: error.message };
  return { ok: true as const };
}

export async function removePushSubscriptionAction(endpoint: string) {
  const user = await requireUser();
  const admin = createAdminClient();
  await admin.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", endpoint);
  return { ok: true as const };
}
