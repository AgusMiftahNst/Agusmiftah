import { AppState } from '../types';

export type SyncStateStatus = 'synced' | 'syncing' | 'offline';

let lastServerTimestamp = 0;
let isPushing = false;
let pendingStateToPush: AppState | null = null;

export interface FetchServerResult {
  state: AppState | null;
  empty: boolean;
  serverUpdatedAt?: number;
}

// Fetch state from server with cache busting
export async function fetchServerStateDetailed(): Promise<FetchServerResult> {
  try {
    const res = await fetch(`/api/state?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) return { state: null, empty: false };
    const data = await res.json();
    if (data && data.empty) {
      return { state: null, empty: true };
    }
    if (data && data.habits) {
      if (data.serverUpdatedAt) {
        lastServerTimestamp = data.serverUpdatedAt;
      }
      return { state: data as AppState, empty: false, serverUpdatedAt: data.serverUpdatedAt };
    }
  } catch (err) {
    // Offline or server temporarily unreachable
  }
  return { state: null, empty: false };
}

// Quick fetch
export async function fetchServerState(): Promise<AppState | null> {
  const result = await fetchServerStateDetailed();
  return result.state;
}

// Push state to server with automatic queued retry
export async function pushServerState(state: AppState): Promise<{ success: boolean; serverUpdatedAt?: number }> {
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
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(state)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.serverUpdatedAt) {
        lastServerTimestamp = data.serverUpdatedAt;
      }
      return { success: true, serverUpdatedAt: data.serverUpdatedAt };
    }
  } catch (err) {
    console.warn('Sync push to server failed, cached in localStorage:', err);
    return { success: false };
  } finally {
    isPushing = false;
    if (pendingStateToPush) {
      const queued = pendingStateToPush;
      pendingStateToPush = null;
      // Push queued update
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
    } catch (err) {
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
