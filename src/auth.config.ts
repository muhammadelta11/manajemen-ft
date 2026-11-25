import type { NextAuthConfig } from "next-auth";
import type { AppRole } from "@/lib/roles";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/login")) return true;
      if (pathname.startsWith("/api/auth")) return true;
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: AppRole }).role;
        token.isKaprodi = (user as { isKaprodi: boolean }).isKaprodi;
        token.prodiId = (user as { prodiId: string | null }).prodiId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
        session.user.isKaprodi = Boolean(token.isKaprodi);
        session.user.prodiId = (token.prodiId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
