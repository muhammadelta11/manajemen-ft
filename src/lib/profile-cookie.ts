import type { SessionUser } from "@/lib/rbac";
import type { AppRole } from "@/lib/roles";

export const PROFILE_COOKIE = "mft_profile";

const ROLES: AppRole[] = [
  "super_admin",
  "admin_arsip",
  "admin_kepegawaian",
  "pegawai",
  "pimpinan",
];

function toBase64Url(text: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(text, "utf8").toString("base64url");
  }
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(raw: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(raw, "base64url").toString("utf8");
  }
  const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeProfile(user: SessionUser): string {
  return toBase64Url(JSON.stringify(user));
}

export function decodeProfile(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(raw)) as SessionUser;
    if (!parsed?.id || !parsed.email || !ROLES.includes(parsed.role)) return null;
    return {
      id: String(parsed.id),
      name: String(parsed.name ?? ""),
      email: String(parsed.email),
      role: parsed.role,
      isKaprodi: Boolean(parsed.isKaprodi),
      prodiId: parsed.prodiId ?? null,
    };
  } catch {
    return null;
  }
}

export async function setProfileCookie(user: SessionUser) {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set(PROFILE_COOKIE, encodeProfile(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearProfileCookie() {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.delete(PROFILE_COOKIE);
}
