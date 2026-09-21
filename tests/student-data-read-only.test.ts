import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const studentsRoute = readFileSync("app/api/students/route.ts", "utf8");
const studentsPage = readFileSync("app/students/page.tsx", "utf8");
const dashboard = readFileSync("app/dashboard/page.tsx", "utf8");

test("student data remains read-only in the application", () => {
  assert.doesNotMatch(studentsRoute, /export async function POST/);
  assert.doesNotMatch(
    studentsPage,
    /AddStudentModal|Add Student|handleAddStudent/,
  );
  assert.doesNotMatch(
    dashboard,
    /AddStudentModal|onAddStudent|handleAddStudent/,
  );
});
