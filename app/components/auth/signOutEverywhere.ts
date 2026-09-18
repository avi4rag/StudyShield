"use client";

import { signOut as authSignOut } from "next-auth/react";
import { clearCache } from "@/lib/cache";

export async function signOutEverywhere() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  await authSignOut({ redirect: false }).catch(() => undefined);
  clearCache();
}