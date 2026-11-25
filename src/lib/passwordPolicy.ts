// The password rule, the same as the API's (ELS-Server src/auth/passwordPolicy.ts).
// Every form that sets a password uses this, so what the form accepts is what
// the server accepts. A "special" character is anything that is not a letter
// or a digit; 72 is bcrypt's input limit.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
export const PASSWORD_RULE_MESSAGE =
  "Include an uppercase letter, a lowercase letter, a number, and a special character";

export const isStrongPassword = (value: string) =>
  value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH && PASSWORD_RE.test(value);

/** Each part of the rule, for live checklists under a password field. */
export const passwordChecks = (value: string) => ({
  length: value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
  lower: /[a-z]/.test(value),
  upper: /[A-Z]/.test(value),
  number: /\d/.test(value),
  special: /[^A-Za-z\d]/.test(value),
});
