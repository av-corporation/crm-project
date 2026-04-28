import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/crm';

interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
    // 1. Initial State Hybrid: Check LocalStorage for fast hydration
    const savedUser = localStorage.getItem('user');
    let snapshotUnsubscribe: (() => void) | null = null;

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // Start profile sync immediately if we have a saved user
        snapshotUnsubscribe = onSnapshot(doc(db, 'users', parsedUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            console.warn("Cached user profile not found in DB");
          }
          setLoading(false);
        }, (error) => {
          console.error("Hydration profile sync error:", error);
          setLoading(false);
        });
      } catch (e) {
        console.error("Failed to parse cached user:", e);
        localStorage.removeItem('user');
      }
    }

    // 2. Real-time Auth State Synchronizer
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state change:', firebaseUser?.uid);
      
      if (firebaseUser) {
        const userData = { uid: firebaseUser.uid, email: firebaseUser.email || '' };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Ensure profile is synced
        if (snapshotUnsubscribe) snapshotUnsubscribe();
        
        snapshotUnsubscribe = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            console.warn("Authenticated user profile not found in DB");
          }
          setLoading(false);
        }, (error) => {
          console.error("Authenticated profile sync error:", error);
          setLoading(false);
        });

        // Seed admin if it's the primary email
        if (firebaseUser.email === 'office.avcorporation@gmail.com') {
          seedAdmin(userData);
        }
      } else {
        // Logged out
        if (snapshotUnsubscribe) snapshotUnsubscribe();
        setUser(null);
        setProfile(null);
        localStorage.removeItem('user');
        setLoading(false);
      }
    });

    // 3. Failsafe: Ensure loading always turns off after 5 seconds max
    const failsafe = setTimeout(() => {
      setLoading(prevState => {
        if (prevState) console.warn("Auth loading failsafe triggered");
        return false;
      });
    }, 5000);

    return () => {
      if (snapshotUnsubscribe) snapshotUnsubscribe();
      authUnsubscribe();
      clearTimeout(failsafe);
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
        
        // Admin Master Access Failsafe
        const isTryingAdmin = trimmedIdentifier.toLowerCase() === 'admin' || trimmedIdentifier.toLowerCase() === 'office.avcorporation@gmail.com';
        if (isTryingAdmin && (trimmedPassword === '123456' || trimmedPassword === 'admin')) {
          console.log('Internal: Admin master access');
          const admin = await seedAdmin();
          if (admin) {
            const authUser = { uid: admin.uid, email: admin.email || '' };
            setUser(authUser);
            setProfile(admin);
            localStorage.setItem('user', JSON.stringify(authUser));
            clearTimeout(timeout);
            return resolve(admin);
          }
        }

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

          setUser(authUser);
          setProfile(foundUser);
          localStorage.setItem('user', JSON.stringify(authUser));
          clearTimeout(timeout);
          return resolve(foundUser);
        } catch (firebaseError: any) {
          console.log('Internal: Firebase Auth error:', firebaseError.code);
          // 2. Fallback to Firestore check
          if (foundUser && foundUser.password === trimmedPassword) {
            console.log('Internal: DB Fallback success');
            const authUser = { uid: foundUser.uid, email: foundUser.email || '' };
            setUser(authUser);
            setProfile(foundUser);
            localStorage.setItem('user', JSON.stringify(authUser));
            clearTimeout(timeout);
            return resolve(foundUser);
          }
          
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
    setUser(null);
    setProfile(null);
    localStorage.removeItem('user');
  };

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager' || profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, isAdmin, isManager }}>
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
