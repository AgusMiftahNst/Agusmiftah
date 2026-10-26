// Persistent audio storage using browser IndexedDB for custom Adhan and sound files

const DB_NAME = 'JarvisAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_files';

interface AudioRecord {
  id: string;
  dataUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomAudio(
  id: string,
  dataUrl: string,
  fileName: string,
  fileSize: number = 0
): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: AudioRecord = {
        id,
        dataUrl,
        fileName,
        fileSize,
        uploadedAt: Date.now()
      };
      store.put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    // Fallback to localStorage if IndexedDB fails
    try {
      localStorage.setItem(`jarvis_audio_${id}`, dataUrl);
      localStorage.setItem(`jarvis_audio_${id}_name`, fileName);
      return true;
    } catch {
      return false;
    }
  }
}

export async function getCustomAudio(id: string): Promise<{ dataUrl: string; fileName: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as AudioRecord | undefined;
        if (record && record.dataUrl) {
          resolve({ dataUrl: record.dataUrl, fileName: record.fileName });
        } else {
          // Check fallback localStorage
          const localData = localStorage.getItem(`jarvis_audio_${id}`);
          const localName = localStorage.getItem(`jarvis_audio_${id}_name`) || 'Suara Kustom';
          if (localData) {
            resolve({ dataUrl: localData, fileName: localName });
          } else {
            resolve(null);
          }
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch {
    const localData = typeof window !== 'undefined' ? localStorage.getItem(`jarvis_audio_${id}`) : null;
    const localName = typeof window !== 'undefined' ? localStorage.getItem(`jarvis_audio_${id}_name`) : null;
    if (localData) {
      return { dataUrl: localData, fileName: localName || 'Suara Kustom' };
    }
    return null;
  }
}

export async function deleteCustomAudio(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => {
        try {
          localStorage.removeItem(`jarvis_audio_${id}`);
          localStorage.removeItem(`jarvis_audio_${id}_name`);
        } catch {}
        resolve(true);
      };
      tx.onerror = () => resolve(false);
    });
  } catch {
    try {
      localStorage.removeItem(`jarvis_audio_${id}`);
      localStorage.removeItem(`jarvis_audio_${id}_name`);
      return true;
    } catch {
      return false;
    }
  }
}
