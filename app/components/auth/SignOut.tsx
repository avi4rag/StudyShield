"use client";

import { signOut } from "next-auth/react";

export default function SignOut() {
  return (
    <button
      type="button"
      className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Sign out
    </button>
  );
}
