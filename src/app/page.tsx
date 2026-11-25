import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/session";

export const instant = false;

export default async function HomePage() {
  const user = await getOptionalUser();
  redirect(user ? "/dashboard" : "/login");
}
