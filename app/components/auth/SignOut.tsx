"use client";

import { signOutEverywhere } from "./signOutEverywhere";

export default function SignOut() {
  return (
    <button
      type="button"
      className="text-sm font-semibold text-slate-600 transition hover:text-slate-950"
      onClick={async () => {
        await signOutEverywhere();
        window.location.assign("/login");
      }}
    >
      Sign out
    </button>
  );
}
