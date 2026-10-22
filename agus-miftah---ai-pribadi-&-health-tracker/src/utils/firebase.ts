import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "isman-mimika",
  appId: "1:784191510261:web:bcea87156594fe1d3bd7bc",
  apiKey: "AIzaSyDlCeO87_WxP03buQvOTZJMXa2PPv0JfaQ",
  authDomain: "isman-mimika.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-agusmiftahaiprib-e053305c-2d7d-451c-9577-9dba418751d6",
  storageBucket: "isman-mimika.firebasestorage.app",
  messagingSenderId: "784191510261",
  measurementId: "",
  oAuthClientId: "784191510261-39m08kmc22l51ijb18oaq0f75gj09qm2.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'appData', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client initial status: offline/connecting.');
    }
  }
})();
