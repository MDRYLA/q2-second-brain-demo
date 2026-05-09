"use client";

import { generateRecoveryMnemonic, mnemonicToSalt, isValidMnemonic } from "@/lib/crypto/bip39";
import { deriveKey } from "@/lib/crypto/kdf";
import { bytesToBase64, base64ToBytes } from "@/lib/crypto/utils";
import { encrypt, decrypt } from "@/lib/crypto/aes";
import { cacheSalt, getCachedSalt } from "./session-store";

const SENTINEL_PLAINTEXT = "OK";

export class WrongPassphraseError extends Error {
  constructor() {
    super("WRONG_PASSPHRASE");
    this.name = "WrongPassphraseError";
  }
}

export interface SetupResult {
  mnemonic: string;
  saltBase64: string;
  sentinel: string;
  key: Uint8Array;
}

export interface LoginResult {
  key: Uint8Array;
  saltBase64: string;
}

/**
 * First-time setup: generate mnemonic → derive salt → derive key → encrypt sentinel.
 * Sentinel = AES-GCM(key)("OK"). Login używa go do verify że klucz jest poprawny
 * (zamiast generic "Nieprawidłowe hasło" gdy w istocie pada salt fetch / IDB).
 */
export async function setupPassphrase(passphrase: string, userId: string): Promise<SetupResult> {
  const mnemonic = generateRecoveryMnemonic();
  const salt = mnemonicToSalt(mnemonic);
  const saltBase64 = bytesToBase64(salt);
  const key = await deriveKey(passphrase, salt);
  const sentinel = encrypt(SENTINEL_PLAINTEXT, key);
  await cacheSalt(userId, saltBase64);
  return { mnemonic, saltBase64, sentinel, key };
}

/**
 * Login with passphrase. Verify klucza przez sentinel (jeśli istnieje w bazie):
 *   - sentinel = null → legacy user (pre-sesja-14): akceptuj klucz bez verify (no probe available)
 *   - sentinel != null + decrypt OK + plaintext === "OK" → klucz poprawny
 *   - sentinel != null + decrypt fail → WrongPassphraseError
 */
export async function loginWithPassphrase(
  passphrase: string,
  userId: string,
  supabaseSaltBase64: string,
  supabaseSentinel: string | null = null
): Promise<LoginResult> {
  const cached = await getCachedSalt(userId);
  if (cached && cached !== supabaseSaltBase64) {
    await cacheSalt(userId, supabaseSaltBase64);
  } else if (!cached) {
    await cacheSalt(userId, supabaseSaltBase64);
  }
  const salt = base64ToBytes(supabaseSaltBase64);
  const key = await deriveKey(passphrase, salt);

  if (supabaseSentinel) {
    try {
      const plaintext = decrypt(supabaseSentinel, key);
      if (plaintext !== SENTINEL_PLAINTEXT) {
        throw new WrongPassphraseError();
      }
    } catch (err) {
      if (err instanceof WrongPassphraseError) throw err;
      throw new WrongPassphraseError();
    }
  }

  return { key, saltBase64: supabaseSaltBase64 };
}

export async function recoverWithMnemonic(
  mnemonic: string,
  passphrase: string,
  userId: string
): Promise<LoginResult> {
  if (!isValidMnemonic(mnemonic)) {
    throw new Error("Invalid recovery mnemonic");
  }
  const salt = mnemonicToSalt(mnemonic);
  const saltBase64 = bytesToBase64(salt);
  const key = await deriveKey(passphrase, salt);
  await cacheSalt(userId, saltBase64);
  return { key, saltBase64 };
}
