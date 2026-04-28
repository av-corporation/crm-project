import {
  browserLocalPersistence,
  getIdTokenResult,
  setPersistence,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export const AUTH_STORAGE_KEY = 'crm.auth.user';
export const FALLBACK_AUTH_STORAGE_KEY = 'authUser';

export type SessionUser = {
  uid: string;
  email: string;
};

export type FallbackAuthUser = {
  email: string;
  role: 'admin' | 'manager' | 'sales' | 'user';
  isLoggedIn: boolean;
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

export const readFallbackAuthUser = (): FallbackAuthUser | null => {
  const raw = localStorage.getItem(FALLBACK_AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.isLoggedIn || !parsed?.email) return null;
    return {
      email: String(parsed.email).toLowerCase(),
      role: parsed.role || 'admin',
      isLoggedIn: true,
    };
  } catch {
    return null;
  }
};

export const writeFallbackAuthUser = (user: FallbackAuthUser) => {
  localStorage.setItem(FALLBACK_AUTH_STORAGE_KEY, JSON.stringify(user));
};

export const clearFallbackAuthUser = () => {
  localStorage.removeItem(FALLBACK_AUTH_STORAGE_KEY);
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
