import { AppState } from '../types';
import { normalizeAppState } from './storage';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export type SyncStateStatus = 'synced' | 'syncing' | 'offline';

const FIRESTORE_COLLECTION = 'appData';
const FIRESTORE_DOC_ID = 'agus_main_state';

let lastServerTimestamp = 0;
let lastSyncRevision = 0;
let isPushing = false;
let pendingStateToPush: AppState | null = null;

export interface FetchServerResult {
  state: AppState | null;
  empty: boolean;
  serverUpdatedAt?: number;
  syncRevision?: number;
  isHtmlFallback?: boolean;
}

// Fetch state from Firestore Cloud (or local server fallback)
export async function fetchServerStateDetailed(): Promise<FetchServerResult> {
  // 1. Try Firebase Cloud Firestore first (works on Vercel, HP, Laptop)
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.habits) {
        if (typeof data.serverUpdatedAt === 'number') {
          lastServerTimestamp = data.serverUpdatedAt;
        }
        if (typeof data.syncRevision === 'number') {
          lastSyncRevision = data.syncRevision;
        }
        return {
          state: normalizeAppState(data),
          empty: false,
          serverUpdatedAt: data.serverUpdatedAt,
          syncRevision: data.syncRevision
        };
      }
    } else {
      // Cloud database document doesn't exist yet
      return { state: null, empty: true };
    }
  } catch (err) {
    console.warn('Firestore fetch failed, checking local API fallback:', err);
  }

  // 2. Fallback to local server /api/state
  try {
    const res = await fetch(`/api/state?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return { state: null, empty: false, isHtmlFallback: true };
      }

      const data = await res.json();
      if (data && data.empty) {
        return { state: null, empty: true };
      }

      if (data && data.habits) {
        if (typeof data.serverUpdatedAt === 'number') {
          lastServerTimestamp = data.serverUpdatedAt;
        }
        if (typeof data.syncRevision === 'number') {
          lastSyncRevision = data.syncRevision;
        }
        return {
          state: normalizeAppState(data),
          empty: false,
          serverUpdatedAt: data.serverUpdatedAt,
          syncRevision: data.syncRevision
        };
      }
    }
  } catch {
    // Offline or server unreachable
  }
  return { state: null, empty: false };
}

// Quick fetch helper
export async function fetchServerState(): Promise<AppState | null> {
  const result = await fetchServerStateDetailed();
  return result.state;
}

// Push state to Cloud Firestore (with auto retry queue and local server sync)
export async function pushServerState(
  state: AppState
): Promise<{ success: boolean; serverUpdatedAt?: number; syncRevision?: number }> {
  if (isPushing) {
    pendingStateToPush = state;
    return { success: true };
  }

  isPushing = true;
  try {
    const newTimestamp = Date.now();
    const newRevision = (state.syncRevision || 0) + 1;
    const payload = {
      ...state,
      serverUpdatedAt: newTimestamp,
      syncRevision: newRevision
    };

    // 1. Save to Cloud Firestore
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    await setDoc(docRef, payload, { merge: true });

    lastServerTimestamp = newTimestamp;
    lastSyncRevision = newRevision;

    // 2. Also background sync to local server if available
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});

    return {
      success: true,
      serverUpdatedAt: newTimestamp,
      syncRevision: newRevision
    };
  } catch (err) {
    console.warn('Push to Firestore failed, attempting local server fallback:', err);
    try {
      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          serverUpdatedAt: data.serverUpdatedAt,
          syncRevision: data.syncRevision
        };
      }
    } catch {}
    return { success: false };
  } finally {
    isPushing = false;
    if (pendingStateToPush) {
      const queued = pendingStateToPush;
      pendingStateToPush = null;
      pushServerState(queued);
    }
  }
}

// Real-time synchronization subscription using Cloud Firestore onSnapshot
export function subscribeToServerState(
  onUpdate: (state: AppState) => void,
  onStatusChange?: (status: SyncStateStatus) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let isUnsubscribed = false;

  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
    const unsubscribeFirestore = onSnapshot(
      docRef,
      (snapshot) => {
        if (isUnsubscribed) return;
        // Skip local optimistic write echoes to prevent state jumping
        if (snapshot.metadata.hasPendingWrites) {
          return;
        }

        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.habits) {
            if (typeof data.serverUpdatedAt === 'number') {
              lastServerTimestamp = data.serverUpdatedAt;
            }
            if (typeof data.syncRevision === 'number') {
              lastSyncRevision = data.syncRevision;
            }
            onUpdate(normalizeAppState(data));
            onStatusChange?.('synced');
          }
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot listener error:', error);
        onStatusChange?.('offline');
      }
    );

    onStatusChange?.('synced');

    return () => {
      isUnsubscribed = true;
      unsubscribeFirestore();
    };
  } catch (err) {
    console.error('Failed to initialize Firestore real-time listener:', err);
    onStatusChange?.('offline');
    return () => {};
  }
}

export function getLastServerTimestamp(): number {
  return lastServerTimestamp;
}

export function getLastSyncRevision(): number {
  return lastSyncRevision;
}

// ==========================================
// Instant Multi-Device URL / QR Sync Engine
// ==========================================

// Encode state safely using native browser Base64 (zero external dependencies)
export function encodeStateToSyncHash(state: AppState): string {
  try {
    const compact: AppState = {
      ...state,
      chatMessages: (state.chatMessages || []).slice(-3)
    };
    const json = JSON.stringify(compact);
    // UTF-8 safe base64 encoding without external libraries
    const encoded = btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
    return `sync=${encodeURIComponent(encoded)}`;
  } catch (e) {
    console.error('Failed to encode sync state:', e);
    return '';
  }
}

// Decode compressed state from URL hash
export function decodeSyncHash(hash: string): AppState | null {
  try {
    let clean = hash.startsWith('#') ? hash.slice(1) : hash;
    if (clean.startsWith('sync=')) {
      clean = clean.slice(5);
    }
    if (!clean) return null;

    const decoded = decodeURIComponent(clean);
    // UTF-8 safe base64 decoding without external libraries
    const json = decodeURIComponent(
      Array.prototype.map
        .call(atob(decoded), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      return normalizeAppState(parsed);
    }
  } catch (e) {
    console.error('Failed to decode sync hash:', e);
  }
  return null;
}

// Generate QR Code data URL using high-reliability QR service (zero external dependencies)
export async function generateSyncQrDataUrl(state: AppState): Promise<string> {
  try {
    const hash = encodeStateToSyncHash(state);
    if (!hash || typeof window === 'undefined') return '';
    const fullUrl = `${window.location.origin}${window.location.pathname}#${hash}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodeURIComponent(fullUrl)}`;
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}

// Generate direct sync link
export function generateSyncUrl(state: AppState): string {
  if (typeof window === 'undefined') return '';
  const hash = encodeStateToSyncHash(state);
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}

// Export backup JSON file
export function exportStateToJsonFile(state: AppState): void {
  if (typeof window === 'undefined') return;
  const str = JSON.stringify(state, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `agus_miftah_data_backup_${d}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Import JSON file
export function parseStateFromJsonFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object') {
          resolve(normalizeAppState(parsed));
        } else {
          reject(new Error('Format file cadangan tidak sesuai (harus berupa data Agus Miftah).'));
        }
      } catch (err) {
        reject(new Error('Gagal membaca file JSON cadangan.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membuka file.'));
    reader.readAsText(file);
  });
}
