import assert from "node:assert/strict";
import test from "node:test";
import {
  getAuthRuntimeConfig,
  isAllowedEmail,
} from "../lib/auth/runtime-config";

const validEnvironment = {
  AUTH_SECRET: "a-secure-auth-secret-that-is-at-least-32-chars",
  AUTH_GOOGLE_ID: "google-client-id",
  AUTH_GOOGLE_SECRET: "google-client-secret",
  AUTH_ALLOWED_EMAIL_DOMAINS: "unacademy.com",
};

test("accepts complete authentication runtime configuration", () => {
  assert.deepEqual(getAuthRuntimeConfig(validEnvironment), {
    authSecret: validEnvironment.AUTH_SECRET,
    googleClientId: validEnvironment.AUTH_GOOGLE_ID,
    googleClientSecret: validEnvironment.AUTH_GOOGLE_SECRET,
    allowedEmails: [],
    allowedEmailDomains: ["unacademy.com"],
  });
});

test("reports all missing authentication variables without exposing values", () => {
  assert.throws(
    () => getAuthRuntimeConfig({}),
    /AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET/,
  );
});

test("rejects short authentication secrets", () => {
  assert.throws(
    () => getAuthRuntimeConfig({ ...validEnvironment, AUTH_SECRET: "too-short" }),
    /AUTH_SECRET must be at least 32 characters long/,
  );
});

test("allows approved company domains and exact emails only", () => {
  const config = getAuthRuntimeConfig({
    ...validEnvironment,
    AUTH_ALLOWED_EMAILS: "approved@company.example",
    AUTH_ALLOWED_EMAIL_DOMAINS: "unacademy.com",
  });

  assert.equal(isAllowedEmail("TEST.EDUCATOR01@UNACADEMY.COM", config), true);
  assert.equal(isAllowedEmail("approved@company.example", config), true);
  assert.equal(isAllowedEmail("unknown@other.example", config), false);
});