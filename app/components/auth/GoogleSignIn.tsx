"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function GoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn() {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/student/dashboard" });
    setIsLoading(false);
  }

  return (
    <button
      type="button"
      className="google-sign-in-button"
      onClick={handleSignIn}
      disabled={isLoading}
    >
      <span className="google-mark" aria-hidden="true">G</span>
      <span>{isLoading ? "Connecting..." : "Continue with Google"}</span>
    </button>
  );
}