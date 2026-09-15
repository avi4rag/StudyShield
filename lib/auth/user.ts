import 'server-only';

import prisma from '@/lib/prisma';
import { getSessionTokenFromRequest, verifySessionToken, type UserSessionPayload } from './session';

export async function getAuthenticatedUser(request: Request): Promise<UserSessionPayload | null> {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const user = await prisma.users.findUnique({
    where: { user_id: session.userId },
    select: { user_id: true, email: true, full_name: true, role: true, is_active: true },
  });
  if (!user || !user.is_active) return null;
  return { userId: user.user_id, email: user.email, name: user.full_name, role: user.role };
}
