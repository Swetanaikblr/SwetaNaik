// Domain Security Subsystem - Types & Interfaces
export interface AuthSession {
  token: string;
  authenticatedAt: number;
  expiresAt: number;
  childId: string;
  role: 'parent' | 'guardian' | 'admin';
}

export interface SecurityPolicy {
  maxFailedAttempts: number;
  baseLockoutSeconds: number;
  maxLockoutSeconds: number;
  sessionDurationMinutes: number;
  requireSaltedHash: boolean;
}

export type AuditEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'LOCKOUT_TRIGGERED'
  | 'SESSION_EXPIRED'
  | 'LOGOUT'
  | 'PIN_CHANGED'
  | 'SECURITY_RESET';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  details: string;
  ipPlaceholder?: string;
  success: boolean;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  lockedUntil?: number;
  attemptsRemaining?: number;
  isLockedOut?: boolean;
  lockoutRemainingSeconds?: number;
  remainingAttempts?: number;
}
