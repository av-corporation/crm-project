import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const requiredConfigKeys: Array<keyof typeof firebaseConfig> = ['apiKey', 'authDomain', 'projectId'];
const missingConfigKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key]);

if (missingConfigKeys.length > 0) {
  console.error('[Firebase] Missing required config keys:', missingConfigKeys.join(', '));
}

if (import.meta.env.DEV) {
  console.info('[Firebase] Initializing project:', firebaseConfig.projectId);
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default app;
