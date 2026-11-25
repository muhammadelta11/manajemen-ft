import { redirect } from "next/navigation";

/** Proxy sudah mengarahkan / → login/dashboard; fallback aman. */
export default function Home() {
  redirect("/dashboard");
}
