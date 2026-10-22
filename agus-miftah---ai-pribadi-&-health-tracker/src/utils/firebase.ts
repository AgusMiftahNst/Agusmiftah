import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

export const firebaseConfig = config;

const app = getApps().length === 0 ? initializeApp(config) : getApp();

export const db =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);

// Validate initial connection
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'appData', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client initial status: offline/connecting.');
    }
  }
})();
