export interface AuthRuntimeConfig {
  authSecret: string;
  googleClientId: string;
  googleClientSecret: string;
}

export function getAuthRuntimeConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): AuthRuntimeConfig {
  const missing = [
    ['AUTH_SECRET', environment.AUTH_SECRET],
    ['AUTH_GOOGLE_ID', environment.AUTH_GOOGLE_ID],
    ['AUTH_GOOGLE_SECRET', environment.AUTH_GOOGLE_SECRET],
  ]
    .filter(([, value]) => !value?.trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required authentication environment variables: ${missing.join(', ')}`);
  }

  if (environment.AUTH_SECRET!.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters long.');
  }

  return {
    authSecret: environment.AUTH_SECRET!,
    googleClientId: environment.AUTH_GOOGLE_ID!,
    googleClientSecret: environment.AUTH_GOOGLE_SECRET!,
  };
}