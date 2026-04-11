import crypto from 'crypto';

/**
 * Generates a cryptographically secure activation token.
 * Returns both the raw token (to send in the email URL) and its SHA-256 hash
 * (to store in the DB — the raw token is never persisted).
 */
export function generateActivationToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  return { raw, hash: hashToken(raw) };
}

/** One-way SHA-256 hash for safe DB storage. */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Expiry date for a new activation token (default 48 h, configurable). */
export function activationExpiresAt(): Date {
  const hours = parseInt(process.env.ACTIVATION_TOKEN_EXPIRES_HOURS ?? '48', 10);
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
