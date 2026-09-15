import 'server-only';

export const SESSION_COOKIE_NAME = 'studyshield_session';

// 7 days in seconds
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 604800 seconds

export const JWT_ALGORITHM = 'HS256';

/**
 * Returns the secret key for signing/verifying JWT session tokens.
 * Throws an error in production if JWT_SECRET environment variable is missing.
 */
export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is not configured.');
    }
    // Safe development fallback
    return new TextEncoder().encode('studyshield_dev_jwt_secret_key_minimum_32_chars!');
  }
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be at least 32 characters in production.');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Standard cookie configuration options for session management.
 */
export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    options: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    },
  };
}
