import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "compooss_auth";
export const AUTH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export const AUTH_MISCONFIGURED_MESSAGE =
  "Login is misconfigured: set both COMPOOSS_USERNAME and COMPOOSS_PASSWORD.";

type Credentials = { username: string; password: string };

// Tokens signed out before they expired, mapped to their expiry time. Kept on
// globalThis because the proxy and route handlers are bundled separately.
const globalForAuth = globalThis as unknown as {
  __compooss_revoked_auth_tokens?: Map<string, number>;
};
const revokedTokens = (globalForAuth.__compooss_revoked_auth_tokens ??=
  new Map<string, number>());

/** Login is required as soon as either credential variable is set. */
export function isAuthEnabled(): boolean {
  return Boolean(process.env.COMPOOSS_USERNAME || process.env.COMPOOSS_PASSWORD);
}

/**
 * Returns null when only one of the variables is set, so a half-configured
 * login rejects everyone instead of leaving the app open.
 */
function getCredentials(): Credentials | null {
  const username = process.env.COMPOOSS_USERNAME;
  const password = process.env.COMPOOSS_PASSWORD;
  return username && password ? { username, password } : null;
}

export function isAuthConfigured(): boolean {
  return getCredentials() !== null;
}

/** Constant-time comparison that also hides the length of the expected value. */
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

// Derived from the credentials, so changing either one signs everyone out.
function signingKey({ username, password }: Credentials): Buffer {
  return createHash("sha256")
    .update(`compooss-auth\0${username}\0${password}`)
    .digest();
}

function sign(payload: string, credentials: Credentials): string {
  return createHmac("sha256", signingKey(credentials))
    .update(payload)
    .digest("base64url");
}

export function verifyCredentials(username: string, password: string): boolean {
  const credentials = getCredentials();
  if (!credentials) return false;
  // Evaluate both so the response time doesn't reveal which one was wrong.
  const usernameMatches = safeEqual(username, credentials.username);
  const passwordMatches = safeEqual(password, credentials.password);
  return usernameMatches && passwordMatches;
}

/** Token format: base64url({ u, exp }).hmac */
export function createAuthToken(username: string): string {
  const credentials = getCredentials();
  if (!credentials) throw new Error(AUTH_MISCONFIGURED_MESSAGE);
  const exp = Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ u: username, exp })).toString(
    "base64url",
  );
  return `${payload}.${sign(payload, credentials)}`;
}

/**
 * Invalidates a token on logout, so a copy of the cookie stops working too.
 * Held in memory, so a server restart forgets revocations.
 */
export function revokeAuthToken(token: string | undefined): void {
  if (!token) return;
  const now = Date.now();
  for (const [revoked, expiresAt] of revokedTokens) {
    if (expiresAt < now) revokedTokens.delete(revoked);
  }
  revokedTokens.set(token, now + AUTH_MAX_AGE_SECONDS * 1000);
}

/** Returns the signed-in username, or null if the token is missing, forged, expired or revoked. */
export function verifyAuthToken(token: string | undefined): string | null {
  const credentials = getCredentials();
  if (!credentials || !token || revokedTokens.has(token)) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, credentials))) {
    return null;
  }

  try {
    const { u, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof u !== "string" || typeof exp !== "number") return null;
    return exp * 1000 > Date.now() ? u : null;
  } catch {
    return null;
  }
}
