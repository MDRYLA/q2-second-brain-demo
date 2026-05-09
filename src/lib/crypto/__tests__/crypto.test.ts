import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../aes";
import { generateSalt, PBKDF2_ITERATIONS } from "../kdf";
import { generateRecoveryMnemonic, mnemonicToSalt, isValidMnemonic } from "../bip39";
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";

// For test speed: use 1k iterations (not 600k) — production tests are integration tests
const TEST_ITERATIONS = 1_000;

async function testDeriveKey(passphrase: string, salt: Uint8Array): Promise<Uint8Array> {
  const password = new TextEncoder().encode(passphrase);
  return pbkdf2Async(sha256, password, salt, { c: TEST_ITERATIONS, dkLen: 32 });
}

describe("AES-256-GCM encryption", () => {
  it("encrypt → decrypt roundtrip (short string)", async () => {
    const salt = generateSalt();
    const key = await testDeriveKey("test-passphrase", salt);
    const plain = "Dzisiaj był dobry dzień.";
    const enc = encrypt(plain, key);
    expect(enc).toMatch(/^ENC:\{/);
    expect(decrypt(enc, key)).toBe(plain);
  });

  it("encrypt → decrypt roundtrip (empty string)", async () => {
    const key = await testDeriveKey("pw", generateSalt());
    expect(decrypt(encrypt("", key), key)).toBe("");
  });

  it("encrypt → decrypt roundtrip (UTF-8 z polskimi znakami)", async () => {
    const key = await testDeriveKey("pw", generateSalt());
    const plain = "Hello user! A turtle swims in a river. City, Region — żółw, łódź.";
    expect(decrypt(encrypt(plain, key), key)).toBe(plain);
  });

  it("encrypt → decrypt roundtrip (very long string 100KB)", async () => {
    const key = await testDeriveKey("pw", generateSalt());
    const plain = "A".repeat(100_000);
    expect(decrypt(encrypt(plain, key), key)).toBe(plain);
  });

  it("wrong passphrase → decrypt throws", async () => {
    const salt = generateSalt();
    const key = await testDeriveKey("correct-passphrase", salt);
    const wrongKey = await testDeriveKey("wrong-passphrase", salt);
    const enc = encrypt("secret", key);
    expect(() => decrypt(enc, wrongKey)).toThrow();
  });

  it("wrong salt → decrypt throws", async () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    const key1 = await testDeriveKey("passphrase", salt1);
    const key2 = await testDeriveKey("passphrase", salt2);
    const enc = encrypt("secret", key1);
    expect(() => decrypt(enc, key2)).toThrow();
  });

  it("different nonce → different ciphertext for same plaintext", async () => {
    const key = await testDeriveKey("pw", generateSalt());
    const plain = "same content";
    const enc1 = encrypt(plain, key);
    const enc2 = encrypt(plain, key);
    expect(enc1).not.toBe(enc2); // random nonce → different ciphertext
    // Both decrypt to same plaintext
    expect(decrypt(enc1, key)).toBe(plain);
    expect(decrypt(enc2, key)).toBe(plain);
  });

  it("nonce uniqueness: 100 encrypts → all nonces unique", async () => {
    const key = await testDeriveKey("pw", generateSalt());
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const enc = encrypt("test", key);
      const parsed = JSON.parse(enc.slice(4));
      nonces.add(parsed.n);
    }
    expect(nonces.size).toBe(100);
  });

  it("envelope has correct structure (v, n, ct, t fields)", async () => {
    const key = await testDeriveKey("pw", generateSalt());
    const enc = encrypt("hello", key);
    expect(enc).toMatch(/^ENC:/);
    const obj = JSON.parse(enc.slice(4));
    expect(obj).toHaveProperty("v", 1);
    expect(obj).toHaveProperty("n");
    expect(obj).toHaveProperty("ct");
    expect(obj).toHaveProperty("t");
    expect(obj.n.length).toBeGreaterThan(0);
    expect(Buffer.from(obj.n, "base64").length).toBe(12); // 12-byte nonce
    expect(Buffer.from(obj.t, "base64").length).toBe(16); // 16-byte tag
  });

  it("tampered ciphertext → decrypt throws", async () => {
    const key = await testDeriveKey("pw", generateSalt());
    const enc = encrypt("secret", key);
    // Flip one byte in ciphertext
    const parsed = JSON.parse(enc.slice(4));
    const ctBytes = Buffer.from(parsed.ct, "base64");
    ctBytes[0] ^= 0xff;
    parsed.ct = ctBytes.toString("base64");
    const tampered = "ENC:" + JSON.stringify(parsed);
    expect(() => decrypt(tampered, key)).toThrow();
  });

  it("invalid ENC: prefix → decrypt throws", () => {
    const key = new Uint8Array(32);
    expect(() => decrypt("not-encrypted", key)).toThrow(/ENC:/);
  });
});

describe("PBKDF2-SHA256 key derivation", () => {
  it("same passphrase + salt → same key (deterministic)", async () => {
    const salt = generateSalt();
    const key1 = await testDeriveKey("my-passphrase", salt);
    const key2 = await testDeriveKey("my-passphrase", salt);
    expect(Buffer.from(key1).toString("hex")).toBe(Buffer.from(key2).toString("hex"));
  });

  it("different passphrase → different key", async () => {
    const salt = generateSalt();
    const key1 = await testDeriveKey("passphrase1", salt);
    const key2 = await testDeriveKey("passphrase2", salt);
    expect(Buffer.from(key1).toString("hex")).not.toBe(Buffer.from(key2).toString("hex"));
  });

  it("generateSalt returns 32 bytes of non-zero entropy", () => {
    const salt = generateSalt();
    expect(salt.length).toBe(32);
    // Very unlikely all zeros
    expect(salt.some((b) => b !== 0)).toBe(true);
  });

  it("PBKDF2_ITERATIONS is at least 600k (OWASP 2023)", () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000);
  });
});

describe("BIP39 mnemonic + recovery", () => {
  it("generates valid 12-word mnemonic", () => {
    const m = generateRecoveryMnemonic();
    const words = m.split(" ");
    expect(words.length).toBe(12);
    expect(isValidMnemonic(m)).toBe(true);
  });

  it("mnemonic → salt is deterministic (same mnemonic = same salt)", () => {
    const m = generateRecoveryMnemonic();
    const s1 = mnemonicToSalt(m);
    const s2 = mnemonicToSalt(m);
    expect(Buffer.from(s1).toString("hex")).toBe(Buffer.from(s2).toString("hex"));
  });

  it("different mnemonic → different salt", () => {
    const m1 = generateRecoveryMnemonic();
    const m2 = generateRecoveryMnemonic();
    const s1 = mnemonicToSalt(m1);
    const s2 = mnemonicToSalt(m2);
    expect(Buffer.from(s1).toString("hex")).not.toBe(Buffer.from(s2).toString("hex"));
  });

  it("BIP39 generate → recover key roundtrip", async () => {
    const mnemonic = generateRecoveryMnemonic();
    const passphrase = "demo-secret-passphrase-2024";
    // Setup
    const salt = mnemonicToSalt(mnemonic);
    const key1 = await testDeriveKey(passphrase, salt);
    // Recovery: user enters mnemonic + passphrase
    const recoveredSalt = mnemonicToSalt(mnemonic);
    const key2 = await testDeriveKey(passphrase, recoveredSalt);
    expect(Buffer.from(key1).toString("hex")).toBe(Buffer.from(key2).toString("hex"));
  });

  it("invalid mnemonic → mnemonicToSalt throws", () => {
    expect(() => mnemonicToSalt("invalid word list that does not match bip39 wordlist")).toThrow();
  });

  it("isValidMnemonic returns false for invalid input", () => {
    expect(isValidMnemonic("one two three")).toBe(false);
    expect(isValidMnemonic("")).toBe(false);
  });
});
