import NextAuth, { type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/utils/hash";

type ExtendedSession = Session & { user: Session["user"] & { role?: string } };

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as const,
  },
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email.toLowerCase()),
        });

        if (!user || !user.password_hash) {
          return null;
        }

        const isValid = await verifyPassword(credentials.password, user.password_hash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id as string,
          email: user.email,
          name: user.full_name ?? "Buyer",
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | (User & { role?: string }) | undefined }) {
      if (user) {
        token.role = (user as User & { role?: string }).role ?? token.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const extendedSession = session as ExtendedSession;
      if (extendedSession.user) {
        extendedSession.user.role = token.role as string | undefined;
      }
      return extendedSession;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
