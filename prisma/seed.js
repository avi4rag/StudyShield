import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

if (!process.env.DIRECT_URL) {
  throw new Error("DIRECT_URL is missing. Add your direct Neon URL to .env.");
}

const adapter = new PrismaNeon({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

const firstNames = [
  "Aarav", "Aditi", "Akash", "Ananya", "Arjun", "Bhavna", "Dev", "Diya",
  "Ishaan", "Kavya", "Meera", "Neha", "Priya", "Rahul", "Riya", "Rohan",
  "Saanvi", "Siddharth", "Tanvi", "Vihaan",
];

const lastNames = [
  "Sharma", "Verma", "Patel", "Singh", "Mehta", "Gupta", "Kapoor", "Nair",
  "Reddy", "Iyer",
];

const STUDENT_COUNT = 200;
const HEALTHY_COUNT = 120; // 60%
const MEDIUM_COUNT = 42; // 21%; the remaining 38 (19%) are high risk

const TEST_EDUCATORS = [
  ["Test Educator 01", "test.educator01@unacademy.com", "StudyShield!Test01"],
  ["Test Educator 02", "test.educator02@unacademy.com", "StudyShield!Test02"],
  ["Test Educator 03", "test.educator03@unacademy.com", "StudyShield!Test03"],
  ["Test Educator 04", "test.educator04@unacademy.com", "StudyShield!Test04"],
  ["Test Educator 05", "test.educator05@unacademy.com", "StudyShield!Test05"],
];

async function getOrCreateBatch(batchName) {
  const rows = await prisma.$queryRaw`
    INSERT INTO batches (batch_name)
    VALUES (${batchName})
    ON CONFLICT (batch_name)
    DO UPDATE SET batch_name = EXCLUDED.batch_name
    RETURNING batch_id
  `;
  return rows[0].batch_id;
}

async function getOrCreateEducator(fullName, email) {
  const rows = await prisma.$queryRaw`
    INSERT INTO educators (full_name, email)
    VALUES (${fullName}, ${email})
    ON CONFLICT (email)
    DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING educator_id
  `;
  return rows[0].educator_id;
}

async function getOrCreateTestUser(fullName, email, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$executeRaw`
    INSERT INTO users (email, password_hash, full_name, role, is_active)
    VALUES (${email}, ${passwordHash}, ${fullName}, 'EDUCATOR', true)
    ON CONFLICT (email)
    DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = 'EDUCATOR',
      is_active = true
  `;
}

async function getOrCreateQuiz(batchId, title, dueAt) {
  const existing = await prisma.$queryRaw`
    SELECT quiz_id
    FROM quizzes
    WHERE batch_id = ${batchId} AND title = ${title}
    LIMIT 1
  `;

  if (existing.length > 0) return existing[0].quiz_id;

  const rows = await prisma.$queryRaw`
    INSERT INTO quizzes (batch_id, title, due_at)
    VALUES (${batchId}, ${title}, ${dueAt})
    RETURNING quiz_id
  `;
  return rows[0].quiz_id;
}

async function main() {
  for (const [fullName, email, password] of TEST_EDUCATORS) {
    await getOrCreateTestUser(fullName, email, password);
  }

  const batchIds = [];
  for (let index = 1; index <= 15; index += 1) {
    batchIds.push(await getOrCreateBatch(`Test Batch ${String(index).padStart(2, "0")} - 2026`));
  }

  const educators = [
    ["Anurag Sharma", "anurag.test@studyshield.example"],
    ["Priya Nair", "priya.test@studyshield.example"],
    ["Vikram Mehta", "vikram.test@studyshield.example"],
    ["Kavya Iyer", "kavya.test@studyshield.example"],
  ];
  const educatorIds = [];
  for (const [fullName, email] of educators) {
    educatorIds.push(await getOrCreateEducator(fullName, email));
  }

  // Two quizzes in every batch: 30 test quizzes in total.
  const quizIdsByBatch = new Map();
  for (let batchIndex = 0; batchIndex < batchIds.length; batchIndex += 1) {
    const batchId = batchIds[batchIndex];
    const batchNumber = String(batchIndex + 1).padStart(2, "0");
    const quizOne = await getOrCreateQuiz(
      batchId,
      `Test Quiz A - Batch ${batchNumber}`,
      new Date("2026-09-10T12:00:00Z"),
    );
    const quizTwo = await getOrCreateQuiz(
      batchId,
      `Test Quiz B - Batch ${batchNumber}`,
      new Date("2026-09-17T12:00:00Z"),
    );
    quizIdsByBatch.set(batchId, [quizOne, quizTwo]);
  }

  const students = [];
  const seededAt = Date.now();
  for (let index = 1; index <= STUDENT_COUNT; index += 1) {
    const firstName = firstNames[(index - 1) % firstNames.length];
    const lastName = lastNames[Math.floor((index - 1) / firstNames.length) % lastNames.length];
    const fullName = `${firstName} ${lastName}`;
    const email = `test.student${String(index).padStart(3, "0")}@studyshield.example`;
    const initials = `${firstName[0]}${lastName[0]}`;
    const batchId = batchIds[(index - 1) % batchIds.length];
    // The student API scores completed quizzes and days since login.
    // These profiles yield exactly 120 healthy, 42 medium, and 38 high risk students.
    const isHealthy = index <= HEALTHY_COUNT;
    const isMedium = index > HEALTHY_COUNT && index <= HEALTHY_COUNT + MEDIUM_COUNT;
    const inactiveDays = isHealthy ? (index % 3) : isMedium ? 4 + (index % 3) : 3 + (index % 6);
    const lastLoginAt = new Date(seededAt - inactiveDays * 24 * 60 * 60 * 1000);

    const rows = await prisma.$queryRaw`
      INSERT INTO students (batch_id, full_name, email, avatar_initials, last_login_at, notes)
      VALUES (
        ${batchId}, ${fullName}, ${email}, ${initials}, ${lastLoginAt},
        ${"Seeded test learner. Safe to delete after development testing."}
      )
      ON CONFLICT (email)
      DO UPDATE SET
        batch_id = EXCLUDED.batch_id,
        full_name = EXCLUDED.full_name,
        avatar_initials = EXCLUDED.avatar_initials,
        last_login_at = EXCLUDED.last_login_at
      RETURNING student_id
    `;
    const studentId = rows[0].student_id;
    students.push({ studentId, batchId, fullName, email, inactiveDays });

    // Keep the login activity consistent when the seed is run again.
    const activityExists = await prisma.$queryRaw`
      SELECT activity_id
      FROM student_activities
      WHERE student_id = ${studentId} AND activity_type = ${"login"}
      LIMIT 1
    `;
    if (activityExists.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO student_activities (student_id, activity_type, occurred_at)
        VALUES (${studentId}, ${"login"}, ${lastLoginAt})
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE student_activities
        SET occurred_at = ${lastLoginAt}
        WHERE activity_id = ${activityExists[0].activity_id}
      `;
    }

    // Create/update one attempt, so the risk calculation has quiz data.
    const [quizOne, quizTwo] = quizIdsByBatch.get(batchId);
    const quizId = index % 2 === 0 ? quizOne : quizTwo;
    const isCompleted = isHealthy || isMedium;
    const status = isCompleted ? "completed" : "missed";
    const score = isCompleted ? 50 + (index % 45) : null;
    const submittedAt = isCompleted ? lastLoginAt : null;

    await prisma.$executeRaw`
      INSERT INTO quiz_attempts (quiz_id, student_id, status, score, submitted_at)
      VALUES (${quizId}, ${studentId}, ${status}, ${score}, ${submittedAt})
      ON CONFLICT (quiz_id, student_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        score = EXCLUDED.score,
        submitted_at = EXCLUDED.submitted_at
    `;
  }

  // 30 nudges: one each for the first 30 seeded students.
  for (let index = 0; index < 30; index += 1) {
    const student = students[index];
    const educatorId = educatorIds[index % educatorIds.length];
    const messageType = index % 3 === 0 ? "early_warning" : index % 3 === 1 ? "quiz_reminder" : "check_in";
    const subject = `Test ${messageType.replace("_", " ")} #${String(index + 1).padStart(2, "0")}`;
    const existing = await prisma.$queryRaw`
      SELECT nudge_id
      FROM nudges
      WHERE student_id = ${student.studentId} AND subject = ${subject}
      LIMIT 1
    `;

    if (existing.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO nudges (
          student_id, educator_id, subject, message, message_type, status,
          requires_response, sent_at
        )
        VALUES (
          ${student.studentId}, ${educatorId}, ${subject},
          ${`Hi ${student.fullName}, this is test outreach generated for StudyShield development. Please check your pending learning activity.`},
          ${messageType}, ${"sent"}, ${index % 2 === 0}, ${new Date()}
        )
      `;
    }
  }

  console.log("Seed complete:");
  console.log("- 15 test batches");
  console.log("- 4 test educators");
  console.log("- 200 test students (120 healthy, 42 medium risk, 38 high risk)");
  console.log("- 30 test quizzes");
  console.log("- 200 quiz attempts and login activities");
  console.log("- 30 test nudges");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
