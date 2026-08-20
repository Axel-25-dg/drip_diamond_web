/**
 * Utility module for Client-side Security & Data Hardening
 */

// Simple & efficient string sanitization to prevent XSS / script injection attacks
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

// Deep sanitize form objects
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data };
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeInput(sanitized[key]) as any;
    }
  }
  return sanitized;
}

// Anti Brute-Force Rate Limiter in client memory
class BruteForceGuard {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  public checkAllowed(actionKey: string, maxAttempts = 5, windowMs = 60000): { allowed: boolean; waitSeconds?: number } {
    const now = Date.now();
    const entry = this.attempts.get(actionKey);

    if (!entry) {
      return { allowed: true };
    }

    // Reset if window elapsed
    if (now - entry.lastAttempt > windowMs) {
      this.attempts.delete(actionKey);
      return { allowed: true };
    }

    if (entry.count >= maxAttempts) {
      const waitSeconds = Math.ceil((windowMs - (now - entry.lastAttempt)) / 1000);
      return { allowed: false, waitSeconds };
    }

    return { allowed: true };
  }

  public recordAttempt(actionKey: string): void {
    const now = Date.now();
    const entry = this.attempts.get(actionKey);
    if (!entry) {
      this.attempts.set(actionKey, { count: 1, lastAttempt: now });
    } else {
      entry.count += 1;
      entry.lastAttempt = now;
    }
  }

  public reset(actionKey: string): void {
    this.attempts.delete(actionKey);
  }
}

export const bruteForceGuard = new BruteForceGuard();

// Verify JWT token format integrity to detect malicious tampering in storage
export function isJwtTokenValid(token: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Token expired
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Enforce sensitive log masking in production/error outputs
export function maskSensitiveData(data: Record<string, any>): Record<string, any> {
  const masked = { ...data };
  const sensitiveKeys = ["password", "contrasena", "token", "refresh", "access", "cvv", "creditcard"];
  
  for (const key in masked) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      masked[key] = "[PROTECTED_SENSITIVE_DATA]";
    }
  }
  return masked;
}
