import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/crm';
import {
  clearStoredSessionUser,
  ensureAuthPersistence,
  readStoredSessionUser,
  validateFirebaseSession,
  writeStoredSessionUser,
} from '../services/authSession';

interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);

  const clearSessionState = () => {
    if (profileUnsubscribeRef.current) {
      profileUnsubscribeRef.current();
      profileUnsubscribeRef.current = null;
    }
    setUser(null);
    setProfile(null);
    clearStoredSessionUser();
  };

  const subscribeProfile = (uid: string) => {
    if (profileUnsubscribeRef.current) {
      profileUnsubscribeRef.current();
    }

    profileUnsubscribeRef.current = onSnapshot(
      doc(db, 'users', uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
      },
      (error) => {
        console.error('Profile sync error:', error);
      },
    );
  };

  const refreshProfile = async () => {
    const uid = auth.currentUser?.uid || user?.uid;
    if (!uid) return;

    const profileDoc = await getDoc(doc(db, 'users', uid));
    if (profileDoc.exists()) {
      setProfile(profileDoc.data() as UserProfile);
    }
  };

  // Auto-seed default admin if needed (Firestore only)
  const seedAdmin = async (currentAuthUser?: { uid: string, email: string }): Promise<UserProfile | null> => {
    try {
      const email = 'office.avcorporation@gmail.com';
      const username = 'admin';
      
      console.log('Checking for admin user in DB...');
      const qEmail = query(collection(db, 'users'), where('email', '==', email));
      const qUser = query(collection(db, 'users'), where('username', '==', username));
      
      const [snapEmail, snapUser] = await Promise.all([getDocs(qEmail), getDocs(qUser)]);
      
      let adminProfile: UserProfile | null = null;

      if (snapEmail.empty && snapUser.empty) {
        console.log('Admin not found in DB, creating new admin document...');
        
        // If we don't have a UID, we can't create a real user document that connects to Auth
        // but for seeding purposes we can use a temporary ID or wait for the real UID
        const uid = currentAuthUser?.uid || 'admin-123';
        
        const newAdmin: UserProfile = {
          uid,
          email,
          username,
          mobile: '9876543210',
          name: 'Super Admin',
          role: 'admin',
          password: '123456',
          isPrimary: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', uid), newAdmin);
        adminProfile = newAdmin;
        console.log('Admin seeded successfully');
      } else {
        // Use existing document (prioritize email match)
        const adminDoc = !snapEmail.empty ? snapEmail.docs[0] : snapUser.docs[0];
        const adminData = adminDoc.data() as UserProfile;
        
        // If the UID doesn't match the current auth user, we might need to fix it
        if (currentAuthUser && adminData.uid !== currentAuthUser.uid) {
          console.log('Admin UID mismatch, updating to match current auth user');
          adminProfile = { ...adminData, uid: currentAuthUser.uid };
          await setDoc(doc(db, 'users', currentAuthUser.uid), adminProfile);
        } else {
          // Use existing
          adminProfile = adminData;
        }

        const updates: any = {};
        if (adminProfile.password !== '123456') updates.password = '123456';
        if (adminProfile.username !== 'admin') updates.username = 'admin';
        if (adminProfile.role !== 'admin') updates.role = 'admin';
        if (adminProfile.email !== email) updates.email = email;
        if (!adminProfile.isPrimary) updates.isPrimary = true;

        if (Object.keys(updates).length > 0) {
          console.log('Updating existing admin details:', updates);
          await setDoc(doc(db, 'users', adminProfile.uid), updates, { merge: true });
          adminProfile = { ...adminProfile, ...updates };
        }
      }
      return adminProfile;
    } catch (e) {
      console.error("Seeding failed:", e);
      return null;
    }
  };

  useEffect(() => {
    const hydratedUser = readStoredSessionUser();
    if (hydratedUser) {
      setUser(hydratedUser);
      subscribeProfile(hydratedUser.uid);
    }

    ensureAuthPersistence().catch((error) => {
      console.error('Failed to set auth persistence:', error);
    });

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        clearSessionState();
        setLoading(false);
        return;
      }

      try {
        const validation = await validateFirebaseSession(firebaseUser);
        if (!validation.valid || !validation.sessionUser) {
          await signOut(auth);
          clearSessionState();
          setLoading(false);
          return;
        }

        const nextUser = validation.sessionUser;
        setUser(nextUser);
        writeStoredSessionUser(nextUser);
        subscribeProfile(firebaseUser.uid);

        if (firebaseUser.email === 'office.avcorporation@gmail.com') {
          seedAdmin(nextUser);
        }

        setLoading(false);
      } catch (error) {
        console.error('Token validation failed:', error);
        await signOut(auth).catch(() => undefined);
        clearSessionState();
        setLoading(false);
        return;
      }
    });

    return () => {
      if (profileUnsubscribeRef.current) {
        profileUnsubscribeRef.current();
        profileUnsubscribeRef.current = null;
      }
      authUnsubscribe();
    };
  }, []);

  const signIn = async (identifier: string, password: string): Promise<UserProfile> => {
    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      throw new Error('Please fill all details');
    }

    // Auth timeout failsafe
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Login is taking longer than expected. Please check your internet connection and try again.'));
      }, 10000); // 10s timeout for better UX

      try {
        console.log('Internal: Start signIn sequence');
        
        let emailToUse = trimmedIdentifier;
        let foundUser: UserProfile | null = null;
        const isEmail = trimmedIdentifier.includes('@');
        const isMobile = /^\d+$/.test(trimmedIdentifier);

        // Search Firestore for the user
        let q;
        if (isEmail) {
          q = query(collection(db, 'users'), where('email', '==', trimmedIdentifier.toLowerCase()));
        } else if (isMobile) {
          q = query(collection(db, 'users'), where('mobile', '==', trimmedIdentifier));
        } else {
          q = query(collection(db, 'users'), where('username', '==', trimmedIdentifier.toLowerCase()));
        }

        console.log('Internal: Searching Firestore');
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          foundUser = snapshot.docs[0].data() as UserProfile;
          emailToUse = foundUser.email || '';
          console.log('Internal: User found in DB');
        } else if (!isEmail) {
          console.log('Internal: User not registered');
          clearTimeout(timeout);
          return reject(new Error('User not registered. Please contact your administrator.'));
        } else {
          emailToUse = trimmedIdentifier.toLowerCase();
          console.log('Internal: Using identifier as email');
        }

        // 1. Try Firebase Authentication
        try {
          console.log('Internal: Firebase Auth attempt');
          const userCredential = await signInWithEmailAndPassword(auth, emailToUse, trimmedPassword);
          const authUser = { uid: userCredential.user.uid, email: userCredential.user.email! };
          console.log('Internal: Firebase Auth success');
          
          if (!foundUser) {
            const profileDoc = await getDoc(doc(db, 'users', authUser.uid));
            if (profileDoc.exists()) {
              foundUser = profileDoc.data() as UserProfile;
            }
          }

          if (authUser.email === 'office.avcorporation@gmail.com') {
            const admin = await seedAdmin(authUser);
            if (admin) foundUser = admin;
          }

          if (!foundUser) {
            console.log('Internal: Creating default profile');
            const newProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email,
              username: (authUser.email || 'user').split('@')[0],
              role: authUser.email === 'office.avcorporation@gmail.com' ? 'admin' : 'sales',
              name: (authUser.email || 'user').split('@')[0],
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', authUser.uid), newProfile);
            foundUser = newProfile;
          }

          clearTimeout(timeout);
          return resolve(foundUser);
        } catch (firebaseError: any) {
          console.log('Internal: Firebase Auth error:', firebaseError.code);

          clearTimeout(timeout);
          if (firebaseError.code === 'auth/user-not-found') {
            return reject(new Error('User not registered. Please signup first.'));
          } else if (firebaseError.code === 'auth/wrong-password') {
            return reject(new Error('Incorrect password. Please try again.'));
          }
          return reject(new Error('Authentication failed: ' + (firebaseError.message || 'Unknown error')));
        }
      } catch (error: any) {
        console.error('Internal: Global signIn error:', error);
        clearTimeout(timeout);
        reject(error);
      }
    });
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error("Signout error:", e);
    }
    clearSessionState();
  };

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager' || profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, refreshProfile, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
