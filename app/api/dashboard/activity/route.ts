import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/user';

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function activityIcon(type: string): string {
  switch (type) {
    case 'login': return 'LogIn';
    case 'logout': return 'LogOut';
    case 'quiz_started': return 'HelpCircle';
    case 'quiz_completed': return 'CheckCircle2';
    case 'material_viewed': return 'BookOpen';
    default: return 'Activity';
  }
}

function activityLabel(type: string): string {
  switch (type) {
    case 'login': return 'logged in';
    case 'logout': return 'logged out';
    case 'quiz_started': return 'started a quiz';
    case 'quiz_completed': return 'completed a quiz';
    case 'material_viewed': return 'viewed learning material';
    default: return 'performed an activity';
  }
}

export async function GET(request: Request) {
  try {
    if (!await getAuthenticatedUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const activities = await prisma.student_activities.findMany({
      orderBy: { occurred_at: 'desc' },
      take: 5,
      include: {
        students: true,
      },
    });

    const shaped = activities.map((a) => ({
      id: `act-${a.activity_id}`,
      student: a.students.full_name,
      action: activityLabel(a.activity_type),
      time: timeAgo(a.occurred_at),
      type: a.activity_type,
      severity:
        a.activity_type === 'login' || a.activity_type === 'quiz_completed'
          ? 'positive'
          : 'info',
      icon: activityIcon(a.activity_type),
      details: `${a.students.full_name} — ${a.activity_type.replace('_', ' ')}`,
    }));

    return NextResponse.json(shaped, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard/activity] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
