import {
  browserLocalPersistence,
  getIdTokenResult,
  setPersistence,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export const AUTH_STORAGE_KEY = 'crm.auth.user';

export type SessionUser = {
  uid: string;
  email: string;
};

let persistenceConfigured = false;

export const ensureAuthPersistence = async () => {
  if (persistenceConfigured) return;
  await setPersistence(auth, browserLocalPersistence);
  persistenceConfigured = true;
};

export const readStoredSessionUser = (): SessionUser | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.uid || typeof parsed.uid !== 'string') return null;
    return { uid: parsed.uid, email: parsed.email || '' };
  } catch {
    return null;
  }
};

export const writeStoredSessionUser = (user: SessionUser) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearStoredSessionUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getSessionUser = (): SessionUser | null => {
  if (auth.currentUser) {
    return { uid: auth.currentUser.uid, email: auth.currentUser.email || '' };
  }
  return readStoredSessionUser();
};

export const validateFirebaseSession = async (firebaseUser: User) => {
  const tokenInfo = await getIdTokenResult(firebaseUser, false);
  const isExpired = Date.parse(tokenInfo.expirationTime) <= Date.now();

  if (isExpired) {
    return { valid: false as const, sessionUser: null };
  }

  return {
    valid: true as const,
    sessionUser: { uid: firebaseUser.uid, email: firebaseUser.email || '' },
  };
};
