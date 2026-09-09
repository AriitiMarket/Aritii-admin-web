/** Lightweight validation helpers (also used by the login form). */

export function isEmail(email: string): boolean {
  if (!email) return false;
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email.trim());
}

export function isRequired(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min;
}