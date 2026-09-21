import type { ActivityItem, EventItem, MoodState } from "./types";

const DB_NAME = "nami-private-beta";
const STORE_NAME = "safe-snapshots";
const VERSION = 1;

export type SafeOfflineSnapshot = {
  coupleId: string;
  partnerName: string;
  partnerMood: MoodState | null;
  partnerActivity: string | null;
  relationshipStartedOn: string;
  events: EventItem[];
  activities?: ActivityItem[];
  savedAt: string;
};

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "coupleId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSafeSnapshot(snapshot: SafeOfflineSnapshot) {
  if (typeof indexedDB === "undefined") return;
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(snapshot);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function readSafeSnapshot(coupleId: string) {
  if (typeof indexedDB === "undefined") return null;
  const database = await openDatabase();
  const snapshot = await new Promise<SafeOfflineSnapshot | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(coupleId);
    request.onsuccess = () => resolve((request.result as SafeOfflineSnapshot | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return snapshot;
}

export async function clearOfflineSnapshots() {
  if (typeof indexedDB === "undefined") return;
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
