import { redirect } from "next/navigation";

export const instant = false;

/** Proxy sudah mengarahkan / → login/dashboard; fallback aman. */
export default function Home() {
  redirect("/dashboard");
}
