"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter } from "next/navigation";
import GoogleSignIn from "./GoogleSignIn";

export default function LoginForm({ mode = "login" }) {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fullName, setFullName] = useState("");
  const isSignup = mode === "signup";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;

    const messages = {
      AccessDenied: "Google sign-in was cancelled or denied.",
      Configuration:
        "Google sign-in is not configured yet. Please try again later.",
      OAuthSignin: "Unable to start Google sign-in. Please try again.",
      OAuthCallback: "Google sign-in could not be completed. Please try again.",
      OAuthAccountNotLinked:
        "This Google account is not linked to an existing account.",
    };
    setErrorMessage(
      messages[error] ?? "Unable to complete Google sign-in. Please try again.",
    );
  }, []);

  async function handleSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    setErrorMessage("");

    if (isSignup && !fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter your work email.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);
    const response = await fetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, role: "EDUCATOR" }),
    });
    const data = await response.json().catch(() => ({}));
    setIsLoading(false);
    if (!response.ok) {
      setErrorMessage(data.error ?? "Unable to complete authentication.");
      return;
    }
    if (isSignup) {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) {
        setErrorMessage(loginData.error ?? "Account created. Please sign in.");
        return;
      }
      login(loginData.user);
    } else {
      login(data.user);
    }
  }

  return (
    <main className="login-shell">
      <div className="ambient-grid" aria-hidden="true" />

      {/* Left Brand Panel */}
      <section className="brand-panel">
        <header className="brand-header">
          <div className="brand-mark">S</div>
          <span className="brand-name">StudyShield</span>
        </header>

        <div className="brand-copy">
          <p className="eyebrow">
            <span className="pulse-dot" /> Learning intelligence platform
          </p>
          <h1>
            Keep every learner
            <br />
            <em>moving forward.</em>
          </h1>
          <p className="intro">
            Spot the quiet signals, support students sooner, and turn
            uncertainty into a clear next step.
          </p>
        </div>

        <div className="signal-card" aria-label="Live learning signals preview">
          <div className="signal-card-top">
            <div>
              <p className="mini-label">Live learning signals</p>
              <p className="signal-status">
                <span className="status-dot" /> System healthy
              </p>
            </div>
            <span className="signal-time">updated just now</span>
          </div>
          <div className="signal-chart" aria-hidden="true">
            <div className="chart-line" />
            <span className="chart-point point-one" />
            <span className="chart-point point-two" />
            <span className="chart-point point-three" />
            <span className="chart-point point-four" />
          </div>
          <div className="signal-footer">
            <div>
              <strong>94.2%</strong>
              <span>learners on track</span>
            </div>
            <div>
              <strong className="green">+12.8%</strong>
              <span>engagement this week</span>
            </div>
          </div>
        </div>

        <footer className="brand-footer">
          <span>Built for thoughtful intervention.</span>
          <span>v2.4</span>
        </footer>
      </section>

      {/* Right Form Panel */}
      <section className="form-panel">
        <div className="form-wrap">
          <div className="mobile-brand">
            <div className="brand-mark">S</div>
            <span className="brand-name">StudyShield</span>
          </div>
          <div className="form-heading">
            <p className="form-kicker">
              {isSignup ? "Get started" : "Welcome back"}
            </p>
            <h2>
              {isSignup
                ? "Create your workspace account"
                : "Sign in to your workspace"}
            </h2>
            <p>
              {isSignup
                ? "Set up your educator account to begin."
                : "Access your learner insights and support queue."}
            </p>
          </div>

          {/* Error message banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-element">
            {isSignup && (
              <>
                <label htmlFor="fullName">Full name</label>
                <div className="input-wrap">
                  <input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </>
            )}
            <label htmlFor="email">Work email</label>
            <div className="input-wrap">
              <span className="input-icon">@</span>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="you@institution.edu"
                autoComplete="email"
                required
              />
            </div>

            <div className="label-row">
              <label htmlFor="password">Password</label>
              <a href="#forgot" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>
            <div className="input-wrap">
              <span className="input-icon lock-icon">*</span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="visibility-button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPassword((prev) => !prev);
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span className="custom-checkbox" />
              Keep me signed in
            </label>

            <button
              className="submit-button"
              type="submit"
              disabled={isLoading}
            >
              <span>
                {isLoading
                  ? "Please wait..."
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
              </span>
              <span>{"->"}</span>
            </button>
          </form>

          {!isSignup && (
            <>
              <div className="auth-divider">
                <span>or</span>
              </div>
              <GoogleSignIn />
            </>
          )}

          {/* Credentials helper pill */}
          <p className="form-note">
            {isSignup ? "Already have an account? " : "New to StudyShield? "}
            <a href={isSignup ? "/login" : "/signup"}>
              {isSignup ? "Sign in" : "Create an account"}
            </a>
          </p>
          <p className="secure-note">
            <span className="shield-icon">+</span> Your workspace is protected
            with enterprise-grade security.
          </p>
        </div>
      </section>
    </main>
  );
}
