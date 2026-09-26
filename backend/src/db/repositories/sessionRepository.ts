import { query } from '../index';
import { UserSessionRow } from '../../types/database';

/**
 * Creates a new active session record storing the SHA-256 hash of the issued token.
 */
export async function createSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<UserSessionRow> {
  const result = await query<UserSessionRow>(
    `INSERT INTO user_sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

/**
 * Verifies that a session is active, has not been revoked, and has not expired.
 * Real server-side session termination guarantee per Correction 3.
 */
export async function isSessionValid(tokenHash: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 FROM user_sessions
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
    [tokenHash]
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Revokes a session on logout.
 * Returns true if a session was actively revoked.
 */
export async function revokeSession(tokenHash: string): Promise<boolean> {
  const result = await query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Revokes all active sessions for a given user (e.g. on password reset or account suspension).
 */
export async function revokeAllUserSessions(userId: string): Promise<number> {
  const result = await query(
    `UPDATE user_sessions
     SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
  return result.rowCount ?? 0;
}
