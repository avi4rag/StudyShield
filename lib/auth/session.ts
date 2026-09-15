import { SignJWT, jwtVerify } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  JWT_ALGORITHM,
  getJwtSecretKey,
  getSessionCookieOptions,
} from './config';

export interface UserSessionPayload {
  userId: number;
  email: string;
  role: 'EDUCATOR' | 'STUDENT' | 'ADMIN';
  name: string;
}

const VALID_ROLES = new Set<UserSessionPayload['role']>(['EDUCATOR', 'STUDENT', 'ADMIN']);

/**
 * Creates a signed JWT session token with explicit issued-at (iat) and expiration (exp) claims.
 */
export async function createSessionToken(payload: UserSessionPayload): Promise<string> {
  const secret = getJwtSecretKey();
  
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

/**
 * Verifies a JWT session token and returns the decoded user payload if valid.
 * Returns null if token is invalid, expired, or malformed.
 */
export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  if (!token) return null;
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });

    if (
      typeof payload.userId === 'number' &&
      typeof payload.email === 'string' &&
      typeof payload.role === 'string' &&
      typeof payload.name === 'string'
    ) {
      if (!VALID_ROLES.has(payload.role as UserSessionPayload['role'])) return null;
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserSessionPayload['role'],
        name: payload.name,
      };
    }
    return null;
  } catch (error) {
    // Token is expired, invalid, or forged
    return null;
  }
}

/**
 * Helper to attach an HTTP-only session cookie to a NextResponse object.
 */
export function setSessionCookie(response: NextResponse, token: string): void {
  const { name, options } = getSessionCookieOptions();
  response.cookies.set(name, token, options);
}

/**
 * Helper to clear/expire the HTTP-only session cookie on a NextResponse object.
 */
export function clearSessionCookie(response: NextResponse): void {
  const { name, options } = getSessionCookieOptions();
  response.cookies.set(name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Helper to extract the session token from an incoming request's cookies.
 */
export function getSessionTokenFromRequest(request: Request | NextRequest): string | null {
  if ('cookies' in request && typeof request.cookies.get === 'function') {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME);
    return cookie ? cookie.value : null;
  }
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map((c) => c.trim().split('='));
  const sessionCookie = cookies.find(([key]) => key === SESSION_COOKIE_NAME);
  return sessionCookie ? decodeURIComponent(sessionCookie[1]) : null;
}
