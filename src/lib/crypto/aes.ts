import { gcm } from "@noble/ciphers/aes.js";
import { bytesToBase64, base64ToBytes } from "./utils";

export const ENVELOPE_VERSION = 1 as const;

interface Envelope {
  v: typeof ENVELOPE_VERSION;
  n: string;
  ct: string;
  t: string;
}

/**
 * AES-256-GCM encrypt. Returns "ENC:" + JSON envelope per ADR-001 Option Y.
 * Key must be 32 bytes (derived via PBKDF2 in kdf.ts).
 */
export function encrypt(plaintext: string, key: Uint8Array): string {
  if (key.length !== 32) throw new Error("Key must be 32 bytes for AES-256-GCM");
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);
  const cipher = gcm(key, nonce);
  const combined = cipher.encrypt(data); // ciphertext + 16-byte GCM tag
  const ct = combined.slice(0, -16);
  const t = combined.slice(-16);
  const envelope: Envelope = {
    v: ENVELOPE_VERSION,
    n: bytesToBase64(nonce),
    ct: bytesToBase64(ct),
    t: bytesToBase64(t),
  };
  return "ENC:" + JSON.stringify(envelope);
}

/**
 * AES-256-GCM decrypt. Throws on wrong key, tampered ciphertext, or invalid format.
 */
export function decrypt(ciphertext: string, key: Uint8Array): string {
  if (key.length !== 32) throw new Error("Key must be 32 bytes for AES-256-GCM");
  if (!ciphertext.startsWith("ENC:")) throw new Error("Invalid ciphertext: missing ENC: prefix");
  let envelope: Envelope;
  try {
    envelope = JSON.parse(ciphertext.slice(4)) as Envelope;
  } catch {
    throw new Error("Invalid ciphertext: malformed JSON envelope");
  }
  if (envelope.v !== ENVELOPE_VERSION) {
    throw new Error(`Unsupported envelope version: ${envelope.v}`);
  }
  const nonce = base64ToBytes(envelope.n);
  const ct = base64ToBytes(envelope.ct);
  const t = base64ToBytes(envelope.t);
  const combined = new Uint8Array(ct.length + 16);
  combined.set(ct);
  combined.set(t, ct.length);
  const cipher = gcm(key, nonce);
  const data = cipher.decrypt(combined); // throws if tag mismatch (wrong key)
  return new TextDecoder().decode(data);
}
