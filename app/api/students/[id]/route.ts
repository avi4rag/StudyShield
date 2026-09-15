import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/user';

function formatLastActive(lastLoginAt: Date | null): string {
  if (!lastLoginAt) return 'Unknown';
  const diff = Date.now() - new Date(lastLoginAt).getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await getAuthenticatedUser(_request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const studentId = parseInt(id, 10);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const s = await prisma.students.findUnique({
      where: { student_id: studentId },
      include: {
        batches: true,
        quiz_attempts: {
          include: { quizzes: true },
          orderBy: { created_at: 'desc' },
        },
        nudges: {
          include: { educators: true },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        student_activities: {
          orderBy: { occurred_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!s) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const now = Date.now();
    const lastLogin = s.last_login_at ? new Date(s.last_login_at) : null;
    const inactiveDays = lastLogin
      ? Math.floor((now - lastLogin.getTime()) / 86_400_000)
      : 99;

    const totalQuizzes = s.quiz_attempts.length;
    const completedAttempts = s.quiz_attempts.filter((a) => a.status === 'completed');
    const completedQuizzes = completedAttempts.length;
    const quizCompletionRate =
      totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0;

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

    const missedDeadlines = s.quiz_attempts.filter((a) => a.status === 'missed').length;
    const averageScore =
      completedAttempts.length > 0
        ? Math.round(
            completedAttempts.reduce((sum, a) => sum + Number(a.score ?? 0), 0) /
              completedAttempts.length
          )
        : 0;

    // Synthesize warning signals
    const signals: { id: string; text: string; type: string; severity: string }[] = [];
    if (inactiveDays >= 7) {
      signals.push({ id: 'sig-1', text: `${inactiveDays} days inactive`, type: 'inactivity', severity: 'high' });
    } else if (inactiveDays >= 3) {
      signals.push({ id: 'sig-1', text: `${inactiveDays} days inactive`, type: 'inactivity', severity: 'medium' });
    }
    if (quizCompletionRate < 50) {
      signals.push({ id: 'sig-2', text: `Quiz completion ${quizCompletionRate}%`, type: 'quiz', severity: quizCompletionRate < 30 ? 'high' : 'medium' });
    }
    if (missedDeadlines > 0) {
      signals.push({ id: 'sig-3', text: `${missedDeadlines} missed quiz${missedDeadlines > 1 ? 'zes' : ''}`, type: 'quiz', severity: 'medium' });
    }

    return NextResponse.json({
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
        statusCategory === 'HIGH' ? 'Reach out' : statusCategory === 'MEDIUM' ? 'Monitor' : 'On Track',
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
        riskHistory: null,
      },
    });
  } catch (error) {
    console.error('[GET /api/students/[id]] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}
