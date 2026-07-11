import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  Firestore,
  enableMultiTabIndexedDbPersistence,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getFunctions, Functions } from 'firebase/functions';

const firebaseConfig = {
  apiKey:            'AIzaSyDW6Niv0-Ol65RsZ0tUzPT8e5gXLfpKTRs',
  authDomain:        'orion-ai-87220.firebaseapp.com',
  projectId:         'orion-ai-87220',
  storageBucket:     'orion-ai-87220.firebasestorage.app',
  messagingSenderId: '928645630976',
  appId:             '1:928645630976:web:c4bcbb16578b458b39dce5',
  measurementId:     'G-2CRR1S7HJL',
};

// Prevent double-init (React StrictMode / HMR)
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth:      Auth             = getAuth(app);
export const db:        Firestore        = getFirestore(app);
export const storage:   FirebaseStorage  = getStorage(app);
export const functions: Functions        = getFunctions(app);

// Enable offline persistence (graceful fail if multi-tab unsupported)
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open — only one tab gets persistence
    console.warn('[Firestore] Persistence unavailable (multiple tabs)');
  } else if (err.code === 'unimplemented') {
    // Browser doesn't support persistence
    console.warn('[Firestore] Persistence not supported in this browser');
  }
});

export { app };
