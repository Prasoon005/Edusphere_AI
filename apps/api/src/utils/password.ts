import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

const PASSWORD_RULES = {
  minLength: 8,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecial: /[^A-Za-z0-9]/,
};

export function validatePasswordStrength(password: string): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (password.length < PASSWORD_RULES.minLength) {
    reasons.push(`Must be at least ${PASSWORD_RULES.minLength} characters`);
  }
  if (!PASSWORD_RULES.hasUpper.test(password)) reasons.push("Must contain an uppercase letter");
  if (!PASSWORD_RULES.hasLower.test(password)) reasons.push("Must contain a lowercase letter");
  if (!PASSWORD_RULES.hasNumber.test(password)) reasons.push("Must contain a number");
  if (!PASSWORD_RULES.hasSpecial.test(password)) reasons.push("Must contain a special character");

  return { valid: reasons.length === 0, reasons };
}
