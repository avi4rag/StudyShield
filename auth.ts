import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { randomUUID } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";
import prisma from "@/lib/prisma";
import { getAuthRuntimeConfig, isAllowedEmail } from "@/lib/auth/runtime-config";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const config = getAuthRuntimeConfig();
      if (!isAllowedEmail(user.email, config)) return false;

      await prisma.users.upsert({
        where: { email: user.email.toLowerCase() },
        update: {
          full_name: user.name ?? user.email,
          is_active: true,
        },
        create: {
          email: user.email.toLowerCase(),
          full_name: user.name ?? user.email,
          password_hash: await hashPassword(randomUUID()),
          role: "EDUCATOR",
        },
      });

      return true;
    },
  },
});
