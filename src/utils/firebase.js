import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let db = null;

try {
  if (!firebaseConfig.databaseURL) throw new Error('VITE_FIREBASE_DATABASE_URL belum diset');
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.error('[Firebase]', e.message);
}

export { db };
