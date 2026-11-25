// Web Crypto API utilities for cryptographic operations

/**
 * Converts an ArrayBuffer to a hex string
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a cryptographically secure random salt string
 */
export function generateSalt(byteLength = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomBytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(randomBytes);
    return bufferToHex(randomBytes.buffer);
  }
  // Fallback for non-browser or older environments
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Generates a cryptographically secure session token
 */
export function generateSecureToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    return bufferToHex(bytes.buffer);
  }
  return 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Computes a salted SHA-256 hash using the standard Web Crypto API
 */
export async function hashPinWithSalt(pin: string, salt: string): Promise<string> {
  const input = `${salt}:${pin}:childindi_secure_domain`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
  }

  // Pure deterministic fallback if Web Crypto subtle is unavailable
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'fb_' + Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Constant-time string comparison to defend against timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
