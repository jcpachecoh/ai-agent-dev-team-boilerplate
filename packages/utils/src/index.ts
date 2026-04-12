/**
 * Format a price value as currency string.
 */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Generate a unique identifier.
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const atIndex = email.indexOf("@");
  if (atIndex < 1 || atIndex !== email.lastIndexOf("@")) return false;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length > 64 || domain.length === 0) return false;
  return domain.includes(".");
}
