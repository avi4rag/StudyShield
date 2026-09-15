import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/user';

// Risk formula: R(t) = min(100, 0.6 * (100 - Q) + 0.4 * L)
// where L = min(100, inactiveDays * 25), Q = quizCompletionRate (0-100)
function computeRisk(inactiveDays: number, quizCompletionRate: number) {
  const L = Math.min(100, inactiveDays * 25);
  const Q = Math.max(0, Math.min(100, quizCompletionRate));
  const riskScore = Math.round(Math.min(100, 0.6 * (100 - Q) + 0.4 * L));
  const statusCategory = riskScore >= 70 ? 'HIGH' : riskScore >= 40 ? 'MEDIUM' : 'HEALTHY';
  const status =
    statusCategory === 'HIGH'
      ? 'High Risk'
      : statusCategory === 'MEDIUM'
        ? 'Medium Risk'
        : 'Healthy';
  return { riskScore, statusCategory, status };
}

function buildSignals(inactiveDays: number, quizCompletionRate: number, riskScore: number) {
  const signals: { id: string; text: string; type: string; severity: string }[] = [];
  let idx = 0;

  if (inactiveDays >= 7) {
    signals.push({
      id: `sig-inactivity-${idx++}`,
      text: `${inactiveDays} days inactive`,
      type: 'inactivity',
      severity: 'high',
    });
  } else if (inactiveDays >= 3) {
    signals.push({
      id: `sig-inactivity-${idx++}`,
      text: `${inactiveDays} days inactive`,
      type: 'inactivity',
      severity: 'medium',
    });
  }

  if (quizCompletionRate < 50) {
    signals.push({
      id: `sig-quiz-${idx++}`,
      text: `Quiz completion ${quizCompletionRate.toFixed(0)}%`,
      type: 'quiz',
      severity: quizCompletionRate < 30 ? 'high' : 'medium',
    });
  }

  if (riskScore < 40 && inactiveDays === 0) {
    signals.push({
      id: `sig-positive-${idx++}`,
      text: 'Consistent daily logins',
      type: 'login',
      severity: 'positive',
    });
  }

  return signals;
}

function formatLastActive(lastLoginAt: Date | null): string {
  if (!lastLoginAt) return 'Unknown';
  const now = Date.now();
  const diff = now - new Date(lastLoginAt).getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export async function GET(request: Request) {
  try {
    if (!await getAuthenticatedUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Fetch all students with their batch and quiz data
    const students = await prisma.students.findMany({
      include: {
        batches: true,
        quiz_attempts: {
          include: {
            quizzes: true,
          },
        },
      },
      orderBy: { student_id: 'asc' },
    });

    // For each student compute risk and shape the response
    const shaped = students.map((s) => {
      const now = Date.now();
      const lastLogin = s.last_login_at ? new Date(s.last_login_at) : null;
      const inactiveDays = lastLogin
        ? Math.floor((now - lastLogin.getTime()) / 86_400_000)
        : 99;

      // Total quizzes in this student's batch
      const batchQuizIds = new Set(
        s.quiz_attempts.map((a) => a.quiz_id)
      );
      const totalQuizzes = batchQuizIds.size;
      const completedQuizzes = s.quiz_attempts.filter(
        (a) => a.status === 'completed'
      ).length;
      const quizCompletionRate =
        totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;

      const { riskScore, statusCategory, status } = computeRisk(inactiveDays, quizCompletionRate);
      const signals = buildSignals(inactiveDays, quizCompletionRate, riskScore);

      // Average score from completed attempts
      const completedAttempts = s.quiz_attempts.filter(
        (a) => a.status === 'completed' && a.score !== null
      );
      const averageScore =
        completedAttempts.length > 0
          ? Math.round(
              completedAttempts.reduce((sum, a) => sum + Number(a.score), 0) /
                completedAttempts.length
            )
          : 0;

      const missedDeadlines = s.quiz_attempts.filter(
        (a) => a.status === 'missed'
      ).length;

      return {
        id: String(s.student_id),
        name: s.full_name,
        avatar: s.avatar_initials ?? s.full_name.substring(0, 2).toUpperCase(),
        email: s.email,
        batch: s.batches.batch_name,
        riskScore,
        status,
        statusCategory,
        inactiveDays,
        quizCompletionRate,
        lastActive: formatLastActive(lastLogin),
        recommendedAction:
          statusCategory === 'HIGH'
            ? 'Reach out'
            : statusCategory === 'MEDIUM'
              ? 'Monitor'
              : 'On Track',
        signals,
        notes: s.notes ?? null,
        details: {
          quizzesAttempted: completedQuizzes,
          totalQuizzes,
          averageScore,
          missedDeadlines,
          lastLoginDate: lastLogin
            ? lastLogin.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Unknown',
          trend:
            riskScore >= 70 ? 'worsening' : riskScore >= 40 ? 'stable' : 'improving',
          riskHistory: null, // not stored in DB
        },
      };
    });

    return NextResponse.json(shaped, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[GET /api/students] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!await getAuthenticatedUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { name, email, batchName, notes } = body as {
      name: string;
      email: string;
      batchName: string;
      notes?: string;
    };

    if (!name || !email || !batchName) {
      return NextResponse.json(
        { error: 'name, email, and batchName are required' },
        { status: 400 }
      );
    }

    // Find or create batch
    let batch = await prisma.batches.findFirst({ where: { batch_name: batchName } });
    if (!batch) {
      batch = await prisma.batches.create({ data: { batch_name: batchName } });
    }

    const student = await prisma.students.create({
      data: {
        full_name: name,
        email,
        batch_id: batch.batch_id,
        avatar_initials: name
          .split(' ')
          .map((p: string) => p[0])
          .join('')
          .substring(0, 2)
          .toUpperCase(),
        notes: notes ?? null,
        last_login_at: null,
      },
      include: { batches: true },
    });

    return NextResponse.json({
      id: String(student.student_id),
      name: student.full_name,
      avatar: student.avatar_initials ?? name.substring(0, 2).toUpperCase(),
      email: student.email,
      batch: student.batches.batch_name,
      riskScore: 60,
      status: 'Medium Risk',
      statusCategory: 'MEDIUM',
      inactiveDays: 0,
      quizCompletionRate: 0,
      lastActive: 'Just now',
      recommendedAction: 'Monitor',
      signals: [],
      notes: student.notes ?? null,
      details: {
        quizzesAttempted: 0,
        totalQuizzes: 0,
        averageScore: 0,
        missedDeadlines: 0,
        lastLoginDate: 'Unknown',
        trend: 'stable',
        riskHistory: null,
      },
    });
  } catch (error) {
    console.error('[POST /api/students] Error:', error);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}
