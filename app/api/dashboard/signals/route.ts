import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/user';

export async function GET(request: Request) {
  try {
    if (!await getAuthenticatedUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const students = await prisma.students.findMany({
      include: {
        quiz_attempts: true,
      },
    });

    const now = Date.now();

    let inactive7Plus = 0;
    let quizDeclining = 0;
    let loginDropping = 0;

    for (const s of students) {
      const lastLogin = s.last_login_at ? new Date(s.last_login_at) : null;
      const inactiveDays = lastLogin
        ? Math.floor((now - lastLogin.getTime()) / 86_400_000)
        : 99;

      if (inactiveDays >= 7) inactive7Plus++;
      if (inactiveDays >= 3) loginDropping++;

      const total = s.quiz_attempts.length;
      const completed = s.quiz_attempts.filter((a) => a.status === 'completed').length;
      const rate = total > 0 ? (completed / total) * 100 : 0;
      if (rate < 50) quizDeclining++;
    }

    return NextResponse.json([
      {
        id: 'sig-inactivity',
        title: 'Inactive for 7+ days',
        description: 'No recent login activity. Extended inactivity adds to the risk score.',
        action: 'Send a reconnect nudge',
        count: inactive7Plus,
        unit: 'students',
        trend: `${inactive7Plus} students flagged`,
        trendDirection: 'up',
        severity: 'high',
        icon: 'Clock',
        filterKey: 'inactivity',
      },
      {
        id: 'sig-quiz',
        title: 'Missed or incomplete quizzes',
        description: 'Less than half of assigned quizzes are completed, reducing learning momentum.',
        action: 'Remind students about pending quizzes',
        count: quizDeclining,
        unit: 'students',
        trend: `${quizDeclining} students flagged`,
        trendDirection: 'up',
        severity: 'high',
        icon: 'HelpCircle',
        filterKey: 'quiz',
      },
      {
        id: 'sig-login',
        title: 'No login in 3+ days',
        description: 'A recent activity gap can be an early sign that a student is disengaging.',
        action: 'Check in before the gap grows',
        count: loginDropping,
        unit: 'students',
        trend: `${loginDropping} students inactive 3+ days`,
        trendDirection: 'up',
        severity: 'medium',
        icon: 'LogIn',
        filterKey: 'login',
      },
    ], {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard/signals] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }
}
