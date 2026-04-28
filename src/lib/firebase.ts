import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
};

const requiredConfigKeys: Array<keyof typeof resolvedFirebaseConfig> = ['apiKey', 'authDomain', 'projectId'];
const missingConfigKeys = requiredConfigKeys.filter((key) => !resolvedFirebaseConfig[key]);

if (missingConfigKeys.length > 0) {
  console.error('[Firebase] Missing required config keys:', missingConfigKeys.join(', '));
}

if (import.meta.env.DEV) {
  console.info('[Firebase] Initializing project:', resolvedFirebaseConfig.projectId);
}

if (resolvedFirebaseConfig.projectId?.includes('gen-lang-client')) {
  console.warn(
    '[Firebase] Using default Gemini project config. Set VITE_FIREBASE_* env vars to use your CRM Firebase project.',
  );
}

const app = getApps().length ? getApp() : initializeApp(resolvedFirebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);

export default app;
