// Strong password generator. Uses the browser's secure random source and always
// meets the app's password rule (8+ characters with an uppercase letter, a
// lowercase letter, a number and a special character).

const LOWER = "abcdefghijkmnopqrstuvwxyz"; // no l: easy to misread
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O
const DIGITS = "23456789"; // no 0 or 1
const SPECIAL = "!@#$%^&*-_+=?";

// A uniformly random integer in [0, max). Rejection sampling avoids the bias
// a plain modulo would add.
const randomInt = (max: number): number => {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
};
const pick = (chars: string): string => chars[randomInt(chars.length)];

export const generatePassword = (length = 16): string => {
  const size = Math.min(64, Math.max(10, Math.round(length)));
  const all = LOWER + UPPER + DIGITS + SPECIAL;
  // One of each kind first, so the rule is always met, then fill and shuffle.
  const out = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SPECIAL)];
  while (out.length < size) out.push(pick(all));
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
};
