import 'server-only';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { getSessionTokenFromRequest, verifySessionToken, type UserSessionPayload } from './session';

export async function getAuthenticatedUser(request: Request): Promise<UserSessionPayload | null> {
  const token = getSessionTokenFromRequest(request);
  const legacySession = token ? await verifySessionToken(token) : null;
  const authSession = legacySession ? null : await auth();
  if (!legacySession && !authSession?.user?.email) return null;

  const user = await prisma.users.findUnique({
    where: legacySession
      ? { user_id: legacySession.userId }
      : { email: authSession!.user!.email!.toLowerCase() },
    select: { user_id: true, email: true, full_name: true, role: true, is_active: true },
  });
  if (!user || !user.is_active) return null;
  return { userId: user.user_id, email: user.email, name: user.full_name, role: user.role };
}
