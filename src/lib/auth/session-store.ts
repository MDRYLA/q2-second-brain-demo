"use client";

const DB_NAME = "second-brain-session";
const STORE_NAME = "session";
const DB_VERSION = 1;

interface SessionRecord {
  userId: string;
  salt: string; // base64
  cachedAt: number;
}

// In-memory fallback gdy IndexedDB pada (Safari private mode, iOS WKWebView,
// quota exceeded). Cache optymalizacja — canonical source = Supabase users.salt.
const memoryCache = new Map<string, SessionRecord>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "userId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("IndexedDB blocked"));
  });
}

export async function cacheSalt(userId: string, saltBase64: string): Promise<void> {
  const record: SessionRecord = { userId, salt: saltBase64, cachedAt: Date.now() };
  memoryCache.set(userId, record);
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // IndexedDB nie działa (Safari private, blocked, quota) — in-memory wystarczy.
    // Login dalej zadziała: passphrase-flow użyje supabaseSaltBase64 jako canonical.
  }
}

export async function getCachedSalt(userId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(userId);
      req.onsuccess = () => {
        const record = req.result as SessionRecord | undefined;
        resolve(record?.salt ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const mem = memoryCache.get(userId);
    return mem?.salt ?? null;
  }
}

export async function clearSession(userId: string): Promise<void> {
  memoryCache.delete(userId);
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(userId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // OK — in-memory już wyczyszczone.
  }
}
