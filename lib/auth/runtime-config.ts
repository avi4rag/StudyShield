export interface AuthRuntimeConfig {
  authSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  allowedEmails: string[];
  allowedEmailDomains: string[];
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

  const allowedEmails = parseList(environment.AUTH_ALLOWED_EMAILS);
  const allowedEmailDomains = parseList(environment.AUTH_ALLOWED_EMAIL_DOMAINS);

  if (missing.length > 0) {
    throw new Error(`Missing required authentication environment variables: ${missing.join(', ')}`);
  }

  if (allowedEmails.length === 0 && allowedEmailDomains.length === 0) {
    throw new Error('Configure AUTH_ALLOWED_EMAILS or AUTH_ALLOWED_EMAIL_DOMAINS.');
  }

  if (environment.AUTH_SECRET!.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters long.');
  }

  return {
    authSecret: environment.AUTH_SECRET!,
    googleClientId: environment.AUTH_GOOGLE_ID!,
    googleClientSecret: environment.AUTH_GOOGLE_SECRET!,
    allowedEmails,
    allowedEmailDomains,
  };
}

function parseList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(
  email: string,
  config: Pick<AuthRuntimeConfig, 'allowedEmails' | 'allowedEmailDomains'>,
): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split('@')[1];
  return Boolean(
    normalizedEmail &&
      domain &&
      (config.allowedEmails.includes(normalizedEmail) ||
        config.allowedEmailDomains.includes(domain)),
  );
}