// Domain Security Subsystem - Parent Authentication Service
import {
  AuthSession,
  SecurityPolicy,
  AuditLogEntry,
  AuthResult,
} from './SecurityTypes';
import {
  generateSalt,
  generateSecureToken,
  hashPinWithSalt,
  constantTimeCompare,
} from './CryptoUtils';

const DEFAULT_POLICY: SecurityPolicy = {
  maxFailedAttempts: 5,
  baseLockoutSeconds: 30,
  maxLockoutSeconds: 300,
  sessionDurationMinutes: 30,
  requireSaltedHash: true,
};

const STORAGE_KEYS = {
  CREDENTIALS: 'childindi_auth_creds_v2',
  SESSION: 'childindi_auth_session_v2',
  AUDIT_LOGS: 'childindi_auth_audit_v2',
  LOCKOUT_STATE: 'childindi_auth_lockout_v2',
};

interface StoredCredentials {
  salt: string;
  hash: string;
  updatedAt: number;
}

interface LockoutState {
  failedCount: number;
  lockedUntil: number;
}

class ParentAuthServiceImpl {
  private policy: SecurityPolicy = DEFAULT_POLICY;
  private currentSession: AuthSession | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  /**
   * Initializes credentials and restores session if active
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;

    if (typeof window === 'undefined') return;

    try {
      // 1. Check if salted PIN exists; if not, seed default demo PIN "2026"
      const stored = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      if (!stored) {
        await this.setPin('2026', false);
      }

      // 2. Restore existing session if valid
      const sessionRaw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (sessionRaw) {
        const session: AuthSession = JSON.parse(sessionRaw);
        if (session.expiresAt > Date.now()) {
          this.currentSession = session;
        } else {
          this.clearSession();
          this.logAudit('SESSION_EXPIRED', 'Previous parent session expired naturally', true);
        }
      }
    } catch (e) {
      console.warn('Auth system initialization notice:', e);
    }

    this.isInitialized = true;
  }

  /**
   * Authenticates parent using the entered PIN
   */
  public async authenticate(pin: string, childId = 'child_aarav'): Promise<AuthResult> {
    await this.init();

    // 1. Check lockout status
    const lockout = this.getLockoutState();
    if (lockout.lockedUntil > Date.now()) {
      const remainingSec = Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
      this.logAudit('LOCKOUT_TRIGGERED', `Attempt rejected due to active lockout (${remainingSec}s remaining)`, false);
      return {
        success: false,
        error: `Account locked due to consecutive failed attempts. Please wait ${remainingSec} seconds.`,
        lockedUntil: lockout.lockedUntil,
        isLockedOut: true,
        lockoutRemainingSeconds: remainingSec,
      };
    }

    // 2. Verify PIN against salted hash
    const creds = this.getStoredCredentials();
    if (!creds) {
      return { success: false, error: 'Authentication credentials not initialized' };
    }

    const testHash = await hashPinWithSalt(pin, creds.salt);
    const isMatch = constantTimeCompare(testHash, creds.hash);

    if (isMatch) {
      // Success! Reset lockout counter
      this.resetLockoutState();

      // Create new cryptographic session
      const now = Date.now();
      const session: AuthSession = {
        token: generateSecureToken(),
        authenticatedAt: now,
        expiresAt: now + this.policy.sessionDurationMinutes * 60 * 1000,
        childId,
        role: 'parent',
      };

      this.currentSession = session;
      this.persistSession(session);
      this.logAudit('AUTH_SUCCESS', 'Parent PIN verified successfully with secure salt', true);

      return {
        success: true,
        session,
      };
    } else {
      // Failure! Increment lockout tracker
      const newFailedCount = lockout.failedCount + 1;
      let lockedUntil = 0;

      if (newFailedCount >= this.policy.maxFailedAttempts) {
        // Exponential backoff
        const multiplier = Math.pow(2, Math.min(newFailedCount - this.policy.maxFailedAttempts, 4));
        const lockoutDuration = Math.min(
          this.policy.baseLockoutSeconds * multiplier * 1000,
          this.policy.maxLockoutSeconds * 1000
        );
        const remSec = Math.round(lockoutDuration / 1000);
        lockedUntil = Date.now() + lockoutDuration;
        this.saveLockoutState({ failedCount: newFailedCount, lockedUntil });
        this.logAudit('LOCKOUT_TRIGGERED', `Consecutive failed PIN threshold reached (${newFailedCount}). Locked for ${remSec}s`, false);

        return {
          success: false,
          error: `Too many failed attempts. Security lockout active for ${remSec} seconds.`,
          lockedUntil,
          isLockedOut: true,
          lockoutRemainingSeconds: remSec,
        };
      } else {
        this.saveLockoutState({ failedCount: newFailedCount, lockedUntil: 0 });
        const attemptsRemaining = this.policy.maxFailedAttempts - newFailedCount;
        this.logAudit('AUTH_FAILURE', `Invalid PIN attempt. Attempts remaining: ${attemptsRemaining}`, false);

        return {
          success: false,
          error: `Incorrect PIN. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
          attemptsRemaining,
          remainingAttempts: attemptsRemaining,
          isLockedOut: false,
        };
      }
    }
  }

  /**
   * Sets a new Parent PIN with a fresh cryptographic salt
   */
  public async setPin(newPin: string, logAudit = true): Promise<boolean> {
    try {
      const salt = generateSalt(16);
      const hash = await hashPinWithSalt(newPin, salt);
      const creds: StoredCredentials = {
        salt,
        hash,
        updatedAt: Date.now(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(creds));
      }

      if (logAudit) {
        this.logAudit('PIN_CHANGED', 'Parent PIN updated with new cryptographic salt', true);
      }
      return true;
    } catch (e) {
      console.error('Failed to set PIN:', e);
      return false;
    }
  }

  /**
   * Checks if an active session exists and is not expired
   */
  public isAuthenticated(): boolean {
    if (!this.currentSession) return false;
    if (this.currentSession.expiresAt <= Date.now()) {
      this.clearSession();
      return false;
    }
    return true;
  }

  /**
   * Returns current active session or null
   */
  public getSession(): AuthSession | null {
    if (this.isAuthenticated()) {
      return this.currentSession;
    }
    return null;
  }

  /**
   * Logs out current parent session
   */
  public logout(): void {
    if (this.currentSession) {
      this.logAudit('LOGOUT', 'Parent session terminated by user', true);
      this.clearSession();
    }
  }

  /**
   * Locks the parent space (alias for logout)
   */
  public lock(): void {
    this.logout();
  }

  /**
   * Returns remaining lockout seconds if currently in cooldown
   */
  public getLockoutRemainingSeconds(): number {
    const lockout = this.getLockoutState();
    if (lockout.lockedUntil > Date.now()) {
      return Math.ceil((lockout.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  }

  /**
   * Returns the audit log entries
   */
  public getAuditLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Private storage helpers
  private getStoredCredentials(): StoredCredentials | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } catch {}
  }

  private clearSession(): void {
    this.currentSession = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      } catch {}
    }
  }

  private getLockoutState(): LockoutState {
    if (typeof window === 'undefined') return { failedCount: 0, lockedUntil: 0 };
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCKOUT_STATE);
      if (!raw) return { failedCount: 0, lockedUntil: 0 };
      const state: LockoutState = JSON.parse(raw);
      if (state.lockedUntil && state.lockedUntil < Date.now()) {
        // Lockout expired
        return { failedCount: 0, lockedUntil: 0 };
      }
      return state;
    } catch {
      return { failedCount: 0, lockedUntil: 0 };
    }
  }

  private saveLockoutState(state: LockoutState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.LOCKOUT_STATE, JSON.stringify(state));
    } catch {}
  }

  private resetLockoutState(): void {
    this.saveLockoutState({ failedCount: 0, lockedUntil: 0 });
  }

  private logAudit(eventType: AuditLogEntry['eventType'], details: string, success: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      const entry: AuditLogEntry = {
        id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toISOString(),
        eventType,
        details,
        success,
      };
      const logs = this.getAuditLogs();
      const updated = [entry, ...logs.slice(0, 49)];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    } catch {}
  }
}

export const ParentAuthService = new ParentAuthServiceImpl();
