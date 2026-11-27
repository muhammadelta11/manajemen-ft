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

function signingSecret(): string {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "mft-dev-profile"
  );
}

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const bytes = new Uint8Array(sig);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacVerify(payload: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(payload);
  if (expected.length !== signature.length) return false;
  let ok = 0;
  for (let i = 0; i < expected.length; i++) {
    ok |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return ok === 0;
}

function parseUser(parsed: SessionUser): SessionUser | null {
  if (!parsed?.id || !parsed.email || !ROLES.includes(parsed.role)) return null;
  return {
    id: String(parsed.id),
    name: String(parsed.name ?? ""),
    email: String(parsed.email),
    role: parsed.role,
    isKaprodi: Boolean(parsed.isKaprodi),
    prodiId: parsed.prodiId ?? null,
  };
}

export async function encodeProfile(user: SessionUser): Promise<string> {
  const body = toBase64Url(JSON.stringify(user));
  const sig = await hmacSign(body);
  return `${body}.${sig}`;
}

export async function decodeProfile(raw: string | undefined): Promise<SessionUser | null> {
  if (!raw) return null;
  try {
    const dot = raw.lastIndexOf(".");
    // Format baru: body.sig — format lama (tanpa sig) dianggap invalid
    if (dot <= 0) return null;
    const body = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    if (!body || !sig) return null;
    if (!(await hmacVerify(body, sig))) return null;
    return parseUser(JSON.parse(fromBase64Url(body)) as SessionUser);
  } catch {
    return null;
  }
}

export async function setProfileCookie(user: SessionUser) {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set(PROFILE_COOKIE, await encodeProfile(user), {
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
