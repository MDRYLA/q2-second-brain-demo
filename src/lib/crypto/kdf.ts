import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";

export const PBKDF2_ITERATIONS = 600_000;
export const KEY_LENGTH = 32;
export const SALT_LENGTH = 32;

/**
 * Derives 32-byte AES key from passphrase + salt using PBKDF2-SHA256.
 * 600k iterations per OWASP 2023 recommendation.
 */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
  if (salt.length !== SALT_LENGTH) throw new Error(`Salt must be ${SALT_LENGTH} bytes`);
  const password = new TextEncoder().encode(passphrase);
  return pbkdf2Async(sha256, password, salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: KEY_LENGTH,
  });
}

/**
 * Generates a cryptographically random 32-byte salt.
 * Used at registration to generate a unique per-user salt.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}
