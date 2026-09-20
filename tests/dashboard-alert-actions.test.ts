import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const navbar = readFileSync("app/components/layout/Navbar.tsx", "utf8");
const dashboard = readFileSync("app/dashboard/page.tsx", "utf8");

test("dashboard alerts use activity data and support both actions", () => {
  assert.match(navbar, /activities = \[\]/);
  assert.match(navbar, /studyshield_notifications_read/);
  assert.match(navbar, /markNotificationsRead/);
  assert.match(dashboard, /activities=\{activities\}/);
  assert.match(dashboard, /activity-feed/);
  assert.match(dashboard, /onViewAllActivity=\{showActivityFeed\}/);
});