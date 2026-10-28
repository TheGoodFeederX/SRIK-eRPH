/**
 * Thin client for Neon Managed Auth (Better Auth). The browser talks to this
 * server, the server holds the session cookie, so the frontend never needs a
 * third-party origin or a token in localStorage (audit S-03/S-05, TC-NEON-SECRET-01).
 */

export interface NeonAuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

const baseUrl = () => {
  const url = process.env.NEON_AUTH_BASE_URL;
  if (!url) {
    throw new Error('NEON_AUTH_BASE_URL is required (Neon Auth base URL).');
  }
  return url.replace(/\/$/, '');
};

export const authCookieName = () => {
  const configured = process.env.NEON_AUTH_COOKIE_NAME;
  if (configured) return configured;
  return baseUrl().startsWith('https://') ? '__Secure-neon-auth.session_token' : 'neon-auth.session_token';
};

const origin = () => process.env.NEON_AUTH_TRUSTED_ORIGIN ?? process.env.CORS_ORIGIN ?? 'http://localhost:5173';

interface NeonAuthResult {
  ok: boolean;
  status: number;
  /** Exact `name=value` cookie issued by Neon Auth (already URL-encoded, signed value). */
  sessionCookie: string | null;
  user: NeonAuthUser | null;
  message: string | null;
}

function sessionCookieFrom(headers: Headers): string | null {
  const setCookies = headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const pair = raw.split(';')[0].trim();
    if (pair.includes('session_token=')) return pair;
  }
  return null;
}

async function call(path: string, body: unknown, cookiePair?: string | null): Promise<NeonAuthResult> {
  const response = await fetch(`${baseUrl()}/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: origin(),
      ...(cookiePair ? { cookie: cookiePair } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

  const payload = (await response.json().catch(() => null)) as
    | { token?: string; user?: NeonAuthUser; message?: string; code?: string }
    | null;

  return {
    ok: response.ok,
    status: response.status,
    sessionCookie: sessionCookieFrom(response.headers),
    user: payload?.user ?? null,
    message: payload?.message ?? null,
  };
}

export const neonAuth = {
  signUp: (input: { email: string; password: string; name: string }) => call('sign-up/email', input),
  signIn: (input: { email: string; password: string }) => call('sign-in/email', input),
  signOut: (cookiePair: string) => call('sign-out', {}, cookiePair),
  updateUser: (cookiePair: string, input: { name?: string }) => call('update-user', input, cookiePair),
  changePassword: (cookiePair: string, input: { currentPassword: string; newPassword: string }) =>
    call('change-password', input, cookiePair),
  requestPasswordReset: (input: { email: string; redirectTo: string }) => call('request-password-reset', input),
  /** Validates the session cookie pair and returns the current user. */
  async getSession(cookiePair: string | null): Promise<NeonAuthUser | null> {
    if (!cookiePair) return null;

    const response = await fetch(`${baseUrl()}/get-session`, {
      headers: { cookie: cookiePair, origin: origin() },
    });
    if (!response.ok) return null;

    const payload = (await response.json().catch(() => null)) as { user?: NeonAuthUser } | null;
    return payload?.user ?? null;
  },
};
