import NextAuth, { type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/utils/hash";
import { rateLimit, resetRateLimit } from "@/lib/cache/redis";

type AuthRequestHeaders =
  | Record<string, string | string[] | undefined>
  | Headers;

type AuthRequest = {
  headers?: AuthRequestHeaders;
};

type ExtendedSession = Session & {
  user: Session["user"] & { id?: string; role?: string };
};

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
      async authorize(credentials, req: AuthRequest) {
        if (!credentials?.email || !credentials.password) return null;

        const headers = req?.headers as AuthRequestHeaders | undefined;
        const ip =
          ((headers as Record<string, string | string[] | undefined>)?.[
            "x-forwarded-for"
          ] as string | undefined) ||
          ((headers as Record<string, string | string[] | undefined>)?.[
            "x-real-ip"
          ] as string | undefined) ||
          (headers instanceof Headers
            ? headers.get("x-forwarded-for")
            : undefined) ||
          (headers instanceof Headers ? headers.get("x-real-ip") : undefined) ||
          "unknown";
        const limitKey = `login_attempts:${ip}:${credentials.email.toLowerCase()}`;

        const limit = await rateLimit(limitKey, 5, 900);
        if (!limit.success) {
          throw new Error(
            "Too many failed login attempts. Please try again after 15 minutes.",
          );
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email.toLowerCase()),
        });

        if (!user || !user.password_hash) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password_hash,
        );
        if (!isValid) {
          return null;
        }

        await resetRateLimit(limitKey);

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
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: User | (User & { role?: string }) | undefined;
    }) {
      if (user) {
        token.id = (user as User & { id?: string }).id;
        token.role = (user as User & { role?: string }).role ?? token.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      const extendedSession = session as ExtendedSession;
      if (extendedSession.user) {
        (extendedSession.user as any).id = token.id;
        (extendedSession.user as any).role = token.role;
      }
      return extendedSession;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
