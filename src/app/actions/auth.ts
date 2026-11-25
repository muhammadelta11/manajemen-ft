"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email dan kata sandi wajib diisi." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    // Successful auth may still throw a Next.js redirect in some versions.
    if (isRedirectError(error)) throw error;

    if (error instanceof AuthError) {
      return { error: "Email atau kata sandi salah." };
    }

    console.error("[loginAction]", error);
    return { error: "Gagal masuk. Periksa koneksi database lalu coba lagi." };
  }

  redirect("/dashboard");
}
