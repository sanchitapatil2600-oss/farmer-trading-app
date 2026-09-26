import { query } from '../index';
import { AuditLogRow } from '../../types/database';

// Blacklisted keys that must never be persisted to audit log metadata
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordHash',
  'token',
  'token_hash',
  'tokenHash',
  'authorization',
  'secret',
  'authSecret',
]);

/**
 * Sanitizes metadata to strictly remove passwords, tokens, and sensitive secrets.
 */
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Records an immutable event in the audit log.
 */
export async function logAuditEvent(
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, unknown>
): Promise<AuditLogRow> {
  const cleanMeta = sanitizeMetadata(metadata);
  const result = await query<AuditLogRow>(
    `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [actorUserId, action, entityType, entityId, JSON.stringify(cleanMeta)]
  );
  return result.rows[0];
}
