import { AppState } from '../types';
import { loadAppState, saveAppState } from './storage';

export type SyncStateStatus = 'synced' | 'syncing' | 'offline';

let lastServerTimestamp = 0;
let isSyncing = false;

// Fetch state from server
export async function fetchServerState(): Promise<AppState | null> {
  try {
    const res = await fetch('/api/state', {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && !data.empty && data.habits) {
      if (data.serverUpdatedAt) {
        lastServerTimestamp = data.serverUpdatedAt;
      }
      return data as AppState;
    }
  } catch (err) {
    // offline or server starting
  }
  return null;
}

// Push state to server
export async function pushServerState(state: AppState): Promise<boolean> {
  if (isSyncing) return false;
  try {
    isSyncing = true;
    const res = await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.serverUpdatedAt) {
        lastServerTimestamp = data.serverUpdatedAt;
      }
      return true;
    }
  } catch (err) {
    console.warn('Sync push to server failed, cached in localStorage:', err);
  } finally {
    isSyncing = false;
  }
  return false;
}

export function getLastServerTimestamp(): number {
  return lastServerTimestamp;
}
