import { generateMnemonic, mnemonicToEntropy, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";

const SALT_INFO = new TextEncoder().encode("second-brain-kdf-salt-v1");

/**
 * Generates a BIP39 12-word recovery mnemonic.
 * The mnemonic encodes 128 bits of entropy which deterministically
 * derives the PBKDF2 salt. User must back this up to enable recovery.
 */
export function generateRecoveryMnemonic(): string {
  return generateMnemonic(wordlist, 128);
}

/**
 * Derives the 32-byte PBKDF2 salt from a BIP39 mnemonic.
 * Salt = HKDF-SHA256(entropy, undefined, "second-brain-kdf-salt-v1", 32)
 * This is the canonical salt stored in Supabase users.salt.
 */
export function mnemonicToSalt(mnemonic: string): Uint8Array {
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new Error("Invalid mnemonic: checksum mismatch or unknown words");
  }
  const entropy = mnemonicToEntropy(mnemonic, wordlist); // 16 bytes for 12-word mnemonic
  return hkdf(sha256, entropy, undefined, SALT_INFO, 32);
}

/**
 * Validates a BIP39 mnemonic phrase.
 */
export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic, wordlist);
}

/**
 * Formats a mnemonic as numbered word list for display.
 */
export function formatMnemonicForDisplay(mnemonic: string): string {
  return mnemonic
    .split(" ")
    .map((word, i) => `${i + 1}. ${word}`)
    .join("\n");
}
