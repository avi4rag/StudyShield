import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/user';

// Map DB message_type → UI type label
function mapType(dbType: string): string {
  const map: Record<string, string> = {
    check_in: 'Check-in',
    early_warning: 'Early Warning',
    quiz_reminder: 'Quiz Reminder',
    study_reminder: 'Study Reminder',
    encouragement: 'Encouragement',
    follow_up: 'Follow-up',
    custom: 'Custom',
  };
  return map[dbType] ?? 'Check-in';
}

// Map DB status → UI status label
function mapStatus(dbStatus: string): string {
  const map: Record<string, string> = {
    sent: 'Sent',
    delivered: 'Delivered',
    read: 'Read',
    scheduled: 'Scheduled',
    draft: 'Draft',
    failed: 'Failed',
  };
  return map[dbStatus] ?? 'Sent';
}

function formatDate(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export async function GET(request: Request) {
  try {
    if (!await getAuthenticatedUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get('studentId');

    const where = studentIdParam
      ? { student_id: parseInt(studentIdParam, 10) }
      : {};

    const nudges = await prisma.nudges.findMany({
      where,
      include: {
        students: {
          include: { batches: true },
        },
        educators: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const shaped = nudges.map((n) => {
      const student = n.students;
      const educator = n.educators;

      // Compute response status
      let responseStatus = 'Not Required';
      if (n.requires_response) {
        if (n.student_response) {
          responseStatus = 'Responded';
        } else if (n.responded_at) {
          responseStatus = 'Responded';
        } else {
          responseStatus = 'Awaiting Response';
        }
      }

      // Compute a simple risk estimate for display
      const now = Date.now();
      const lastLogin = student.last_login_at ? new Date(student.last_login_at) : null;
      const inactiveDays = lastLogin
        ? Math.floor((now - lastLogin.getTime()) / 86_400_000)
        : 99;
      const L = Math.min(100, inactiveDays * 25);
      const riskScore = Math.round(Math.min(100, 0.6 * 100 + 0.4 * L));
      const riskLevel =
        riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Healthy';

      return {
        id: `nudge-${n.nudge_id}`,
        studentId: String(n.student_id),
        studentName: student.full_name,
        studentAvatar:
          student.avatar_initials ??
          student.full_name.substring(0, 2).toUpperCase(),
        studentEmail: student.email,
        batch: student.batches.batch_name,
        type: mapType(n.message_type),
        subject: n.subject ?? '(No subject)',
        content: n.message,
        trigger: 'Educator Outreach',
        triggerSignalType: 'manual',
        riskLevel,
        riskScore,
        status: mapStatus(n.status),
        responseStatus,
        sentAt: formatDate(n.sent_at),
        deliveredAt: formatDate(n.delivered_at),
        readAt: formatDate(n.read_at),
        respondedAt: formatDate(n.responded_at),
        responseContent: n.student_response ?? null,
        automated: false,
        createdBy: educator ? educator.full_name : 'StudyShield System',
        relatedSignals: [],
        timeline: [
          {
            id: `tl-${n.nudge_id}`,
            date: formatDate(n.sent_at)?.split(',')[0] ?? '',
            time: formatDate(n.sent_at)?.split(', ')[1] ?? '',
            title: 'Message Sent',
            description: 'Outreach message dispatched.',
            type: 'sent',
          },
        ],
      };
    });

    return NextResponse.json(shaped, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[GET /api/nudges] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch nudges' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const {
      studentId,
      subject,
      content,
      type,
      requiresResponse,
      scheduledFor,
    } = body as {
      studentId: string;
      subject?: string;
      content: string;
      type?: string;
      requiresResponse?: boolean;
      scheduledFor?: string;
    };

    if (!studentId || !content) {
      return NextResponse.json(
        { error: 'studentId and content are required' },
        { status: 400 }
      );
    }

    // Map UI type → DB message_type
    const typeMap: Record<string, string> = {
      'Check-in': 'check_in',
      'Early Warning': 'early_warning',
      'Quiz Reminder': 'quiz_reminder',
      'Study Reminder': 'study_reminder',
      'Encouragement': 'encouragement',
      'Follow-up': 'follow_up',
      'Custom': 'custom',
    };
    const dbType = typeMap[type ?? 'Check-in'] ?? 'check_in';

    const educator = await prisma.educators.findFirst({ where: { user_id: user.userId } });

    const isScheduled = !!scheduledFor;
    const now = new Date();

    const nudge = await prisma.nudges.create({
      data: {
        student_id: parseInt(studentId, 10),
        educator_id: educator?.educator_id ?? null,
        subject: subject ?? null,
        message: content,
        message_type: dbType,
        status: isScheduled ? 'scheduled' : 'sent',
        requires_response: requiresResponse ?? true,
        sent_at: isScheduled ? null : now,
        scheduled_for: scheduledFor ? new Date(scheduledFor) : null,
      },
      include: {
        students: { include: { batches: true } },
        educators: true,
      },
    });

    return NextResponse.json({
      id: `nudge-${nudge.nudge_id}`,
      studentId: String(nudge.student_id),
      studentName: nudge.students.full_name,
      studentAvatar:
        nudge.students.avatar_initials ??
        nudge.students.full_name.substring(0, 2).toUpperCase(),
      studentEmail: nudge.students.email,
      batch: nudge.students.batches.batch_name,
      type: type ?? 'Check-in',
      subject: nudge.subject ?? '(No subject)',
      content: nudge.message,
      status: isScheduled ? 'Scheduled' : 'Sent',
      responseStatus: (requiresResponse ?? true) ? 'Awaiting Response' : 'Not Required',
      sentAt: isScheduled ? `${scheduledFor} (Scheduled)` : now.toLocaleString(),
      automated: false,
      createdBy: educator?.full_name ?? 'Educator',
    });
  } catch (error) {
    console.error('[POST /api/nudges] Error:', error);
    return NextResponse.json({ error: 'Failed to create nudge' }, { status: 500 });
  }
}
