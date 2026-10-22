import { AppState } from '../types';
import LZString from 'lz-string';
import QRCode from 'qrcode';
import { normalizeAppState } from './storage';

export type SyncStateStatus = 'synced' | 'syncing' | 'offline';

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

// Fetch state from server with cache busting and strict content-type validation
export async function fetchServerStateDetailed(): Promise<FetchServerResult> {
  try {
    const res = await fetch(`/api/state?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) return { state: null, empty: false };

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Returned HTML (e.g., static hosting / Vercel SPA rewrite fallback)
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

// Push state to server with automatic queued retry
export async function pushServerState(
  state: AppState
): Promise<{ success: boolean; serverUpdatedAt?: number; syncRevision?: number }> {
  if (isPushing) {
    pendingStateToPush = state;
    return { success: true };
  }

  isPushing = true;
  try {
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(state)
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (typeof data.serverUpdatedAt === 'number') {
        lastServerTimestamp = data.serverUpdatedAt;
      }
      if (typeof data.syncRevision === 'number') {
        lastSyncRevision = data.syncRevision;
      }
      return {
        success: true,
        serverUpdatedAt: data.serverUpdatedAt,
        syncRevision: data.syncRevision
      };
    }
  } catch (err) {
    console.warn('Sync push to server failed, cached in localStorage:', err);
    return { success: false };
  } finally {
    isPushing = false;
    if (pendingStateToPush) {
      const queued = pendingStateToPush;
      pendingStateToPush = null;
      pushServerState(queued);
    }
  }
  return { success: false };
}

// Real-time synchronization subscription using Server-Sent Events (SSE)
export function subscribeToServerState(
  onUpdate: (state: AppState) => void,
  onStatusChange?: (status: SyncStateStatus) => void
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }

  let eventSource: EventSource | null = null;
  let isClosed = false;
  let reconnectTimer: number | null = null;

  function connect() {
    if (isClosed) return;

    try {
      eventSource = new EventSource('/api/state/stream');

      eventSource.onopen = () => {
        onStatusChange?.('synced');
      };

      eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data === 'ping') return;
          const data = JSON.parse(event.data);
          if (data && data.habits && typeof data.serverUpdatedAt === 'number') {
            lastServerTimestamp = data.serverUpdatedAt;
            if (typeof data.syncRevision === 'number') {
              lastSyncRevision = data.syncRevision;
            }
            onUpdate(data as AppState);
            onStatusChange?.('synced');
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        onStatusChange?.('offline');
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          reconnectTimer = window.setTimeout(connect, 3000);
        }
      };
    } catch {
      onStatusChange?.('offline');
      if (!isClosed) {
        reconnectTimer = window.setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
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

// Compress and encode AppState for instant URL or QR pairing
export function encodeStateToSyncHash(state: AppState): string {
  try {
    // Only strip long chat history to keep URL short and ultra fast
    const compact: AppState = {
      ...state,
      chatMessages: (state.chatMessages || []).slice(-3)
    };
    const json = JSON.stringify(compact);
    const compressed = LZString.compressToEncodedURIComponent(json);
    return `sync=${compressed}`;
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

    const json = LZString.decompressFromEncodedURIComponent(clean);
    if (!json) return null;

    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      return normalizeAppState(parsed);
    }
  } catch (e) {
    console.error('Failed to decode sync hash:', e);
  }
  return null;
}

// Generate QR Code data URL for instant scanning with HP camera
export async function generateSyncQrDataUrl(state: AppState): Promise<string> {
  try {
    const hash = encodeStateToSyncHash(state);
    if (!hash || typeof window === 'undefined') return '';
    const fullUrl = `${window.location.origin}${window.location.pathname}#${hash}`;
    return await QRCode.toDataURL(fullUrl, {
      margin: 1.5,
      width: 280,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
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
