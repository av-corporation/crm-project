import { 
  collection, 
  addDoc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs,
  getDoc,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Lead, Note, ActivityLog, Product, LeadStatus, UserProfile, StatusConfig, UserRole, Task } from '../types/crm';

// Error handling helper
const handleFirestoreError = (error: any, operation: string, path: string) => {
  const savedUser = localStorage.getItem('user');
  const currentUser = savedUser ? JSON.parse(savedUser) : null;
  
  const errInfo = {
    error: error.message,
    operationType: operation,
    path,
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
    }
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

const getCurrentUser = () => {
  const savedUser = localStorage.getItem('user');
  return savedUser ? JSON.parse(savedUser) : null;
};

// Product Name Mapping
export const cleanProductName = (name: string): string => {
  if (!name) return '';
  const n = name.toUpperCase();
  
  // Specific Mappings from User
  if (n === 'INDUSTRIAL WET & DRY VACUUM CLEANER') return 'Industrial Wet & Dry Vacuum Cleaner';
  if (n === 'FLOOR SCRUBBER DRYER') return 'Floor Scrubber Dryer';
  if (n === 'MANUAL SWEEPER') return 'Manual Sweeper';
  if (n === 'RIDE-ON SCRUBBER DRYER') return 'Ride-on Scrubber Dryer';
  
  if (n.includes('AV (M) 111') || n.includes('AV(M)111') || n.includes('AV (M) 109') || n.includes('AV (M) 110') || n.includes('AV (M) 205') || n.includes('AV (M) 001') || n.includes('AV (M) 002')) return 'Single Disc Machine';
  if (n.includes('AV (M) 201') || n.includes('AV(M)201') || n.includes('AV (M) 211') || n.includes('AV (M) 214')) return 'Vacuum Cleaner';
  if (n.includes('AV (M) 203') || n.includes('AV(M)203') || n.includes('AV (M) 003') || n.includes('AV (M) 004') || n.includes('AV (M) 005') || n.includes('AV (M) 006') || n.includes('AV (M) 007') || n.includes('AV (M) 003B') || n.includes('AV (M) 207') || n.includes('AV (M) 208')) return 'Scrubber Dryer';
  if (n.includes('AV (M) 306') || n.includes('AV (M) 310')) return 'High Pressure Washer';

  // General Mappings
  if (n.includes('WDVC') || n.includes('VACUUM CLEANER')) return 'Vacuum Cleaner';
  if (n.includes('SC') && n.includes('AV')) return 'Vacuum Cleaner';
  if (n.includes('SCRUBBING MACHINE') || n.includes('SINGLE DISC')) return 'Single Disc Machine';
  if (n.includes('POLISHER')) return 'High Speed Polisher';
  if (n.includes('SCRUBBER DRYER')) return 'Scrubber Dryer';
  if (n.includes('MINI SCRUBBER') || n.includes('M-207')) return 'Scrubber Dryer';
  if (n.includes('SWEEPER')) return 'Sweeper';
  if (n.includes('HPW') || n.includes('PRESSURE WASHER')) return 'High Pressure Washer';
  if (n.includes('ESCALATOR CLEANER')) return 'Escalator Cleaner';
  if (n.includes('FOAMER')) return 'Electronic Foamer';
  if (n.includes('UPHOLSTERY') || n.includes('CARPET CLEANER')) return 'Carpet & Upholstery Cleaner';
  if (n.includes('BLOWER')) return 'Blower';
  
  // Remove codes like AV (M) 001, etc.
  let cleaned = name.replace(/AV\s*\(M\)\s*\d+[A-Z]?/gi, '')
                    .replace(/AV-\d+\s*[A-Z]*/gi, '')
                    .replace(/M-\d+[A-Z]?/gi, '')
                    .replace(/\(\s*M\s*\)/gi, '')
                    .replace(/\d{3}/g, '')
                    .trim();
                    
  return cleaned || name;
};

// Status Mapping for cleanup
const mapOldStatus = (status: string): string => {
  if (!status) return 'New';
  const s = status.toLowerCase();
  if (s.includes('not called') || s === 'new') return 'New';
  if (s.includes('call done') || s.includes('contacted') || s.includes('called') || s.includes('interested')) return 'Contacted';
  if (s.includes('follow-up') || s.includes('scheduled')) return 'Follow-up Scheduled';
  if (s.includes('deal done') || s.includes('converted') || s.includes('closed')) return 'Deal Done';
  if (s.includes('lost')) return 'Lost';
  if (s.includes('quotation')) return 'Quotation Sent';
  return status;
};

// Leads
export const subscribeLeads = (callback: (leads: Lead[]) => void, role: string, uid: string, includeDeleted: boolean = false) => {
  let q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    let leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
    
    // Filter by deletion status
    leads = leads.filter(l => includeDeleted ? l.isDeleted === true : l.isDeleted !== true);
    
    // Role-based filtering for Sales
    if (role === 'sales') {
      leads = leads.filter(l => l.assignedTo === uid || l.createdBy === uid);
    }
    
    callback(leads);
  }, (error) => handleFirestoreError(error, 'LIST', 'leads'));
};

export const createLead = async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
  try {
    const user = auth.currentUser || getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      throw new Error('User not authenticated');
    }

    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'leads'), {
      ...lead,
      products: lead.products || [],
      createdBy: user.uid,
      createdAt: now,
      updatedAt: now
    });

    await logActivity(user.uid, docRef.id, 'created');
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, 'CREATE', 'leads');
  }
};

export const updateLead = async (id: string, data: Partial<Lead>) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const leadDoc = await getDoc(doc(db, 'leads', id));
    const oldData = leadDoc.data() as Lead;
    
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'leads', id), {
      ...data,
      updatedAt: now
    });

    // Log status change
    if (data.status && data.status !== oldData.status) {
      await logActivity(user.uid, id, `status changed to ${data.status}`);
    } else {
      await logActivity(user.uid, id, 'updated');
    }
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `leads/${id}`);
  }
};

export const cleanupLeadsData = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'leads'));
    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data() as any;
      let needsUpdate = false;
      const updateData: any = {};

      // 1. Migrate single product to products array
      if (data.product && (!data.products || data.products.length === 0)) {
        updateData.products = [{ name: data.product, quantity: 1 }];
        updateData.product = null; // Remove old field
        needsUpdate = true;
      }

      // 2. Fix Company/Email swap
      if (data.companyName && data.companyName.includes('@')) {
        updateData.email = data.companyName;
        updateData.companyName = data.email && !data.email.includes('@') ? data.email : "Individual";
        needsUpdate = true;
      }

      // 3. Clean Product Names in array
      if (data.products && Array.isArray(data.products)) {
        const cleanedProducts = data.products.map((p: any) => ({
          ...p,
          name: cleanProductName(p.name)
        }));
        if (JSON.stringify(cleanedProducts) !== JSON.stringify(data.products)) {
          updateData.products = cleanedProducts;
          needsUpdate = true;
        }
      }

      // 4. Map Status
      const mappedStatus = mapOldStatus(data.status);
      if (mappedStatus !== data.status) {
        updateData.status = mappedStatus;
        needsUpdate = true;
      }

      if (needsUpdate) {
        batch.update(docSnap.ref, updateData);
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }

    // Also cleanup products collection
    const productSnapshot = await getDocs(collection(db, 'products'));
    const pBatch = writeBatch(db);
    const seenNames = new Set<string>();

    productSnapshot.docs.forEach(pDoc => {
      const pData = pDoc.data() as Product;
      const cleaned = cleanProductName(pData.name);
      const codePattern = /AV\s*\(M\)\s*\d+/i;
      
      // If it's still a code after cleaning, or too short, delete it
      if (codePattern.test(cleaned) || cleaned.length < 3) {
        pBatch.delete(pDoc.ref);
        return;
      }
      
      if (cleaned !== pData.name || seenNames.has(cleaned)) {
        if (seenNames.has(cleaned)) {
          pBatch.delete(pDoc.ref);
        } else {
          pBatch.update(pDoc.ref, { name: cleaned });
          seenNames.add(cleaned);
        }
      } else {
        seenNames.add(cleaned);
      }
    });
    await pBatch.commit();

    return count;
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', 'leads/cleanup');
    return 0;
  }
};

export const deleteLead = async (id: string, permanent: boolean = false) => {
  try {
    if (permanent) {
      await deleteDoc(doc(db, 'leads', id));
      const user = getCurrentUser();
      if (user) await logActivity(user.uid, id, 'permanently deleted lead');
    } else {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'leads', id), {
        isDeleted: true,
        deletedAt: now,
        updatedAt: now
      });
      const user = getCurrentUser();
      if (user) await logActivity(user.uid, id, 'moved lead to recycle bin');
    }
  } catch (error) {
    handleFirestoreError(error, 'DELETE', `leads/${id}`);
  }
};

export const restoreLead = async (id: string) => {
  try {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'leads', id), {
      isDeleted: false,
      deletedAt: null,
      updatedAt: now
    });
    const user = getCurrentUser();
    if (user) await logActivity(user.uid, id, 'restored lead from recycle bin');
  } catch (error) {
    handleFirestoreError(error, 'RESTORE', `leads/${id}`);
  }
};

export const deleteLeadsBulk = async (ids: string[], permanent: boolean = false) => {
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    const user = getCurrentUser();
    
    ids.forEach(id => {
      if (permanent) {
        batch.delete(doc(db, 'leads', id));
      } else {
        batch.update(doc(db, 'leads', id), {
          isDeleted: true,
          deletedAt: now,
          updatedAt: now
        });
      }
    });
    
    await batch.commit();
    
    if (user) {
      await logActivity(user.uid, null, permanent ? `permanently deleted ${ids.length} leads` : `moved ${ids.length} leads to recycle bin`);
    }
  } catch (error) {
    handleFirestoreError(error, 'DELETE_BULK', 'leads');
  }
};

export const checkLeadExistsByPhone = async (phone: string) => {
  try {
    const q = query(collection(db, 'leads'), where('phone', '==', phone));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    handleFirestoreError(error, 'LIST', 'leads');
    return false;
  }
};

export const getLead = async (id: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'leads', id));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Lead;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, 'GET', `leads/${id}`);
  }
};

// Notes
export const subscribeLeadNotes = (leadId: string, callback: (notes: Note[]) => void) => {
  const q = query(
    collection(db, 'notes'), 
    where('leadId', '==', leadId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
    callback(notes);
  }, (error) => handleFirestoreError(error, 'LIST', 'notes'));
};

export const updateNote = async (noteId: string, data: Partial<Note>) => {
  try {
    await updateDoc(doc(db, 'notes', noteId), data);
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `notes/${noteId}`);
  }
};

export const deleteNote = async (noteId: string) => {
  try {
    await deleteDoc(doc(db, 'notes', noteId));
  } catch (error) {
    handleFirestoreError(error, 'DELETE', `notes/${noteId}`);
  }
};

export const addNote = async (leadId: string, note: string, followUpDate?: string) => {
  try {
    const user = getCurrentUser();
    if (!user) return;

    const noteData = {
      leadId,
      createdBy: user.uid,
      note,
      followUpDate: followUpDate || null,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'notes'), noteData);
    
    await logActivity(user.uid, leadId, 'note added');

    // Auto update lead status and follow-up date if follow-up date is set
    if (followUpDate) {
      await updateLead(leadId, { 
        status: 'Follow-up Scheduled',
        followUpDate: followUpDate
      });
    }
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, 'CREATE', 'notes');
  }
};

// Activity Log
export const logActivity = async (userId: string, leadId: string | null, action: string, details?: string) => {
  try {
    await addDoc(collection(db, 'activity_log'), {
      userId,
      leadId,
      action,
      details: details || '',
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

export const subscribeActivityLog = (callback: (logs: ActivityLog[]) => void, role: string, uid: string, limitCount: number = 20, leadId?: string) => {
  let q = query(
    collection(db, 'activity_log'), 
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  if (leadId) {
    q = query(collection(db, 'activity_log'), where('leadId', '==', leadId), orderBy('createdAt', 'desc'));
  }
  
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
    callback(logs);
  }, (error) => handleFirestoreError(error, 'LIST', 'activity_log'));
};

export const subscribeLeadActivityLogs = (leadId: string, callback: (logs: ActivityLog[]) => void) => {
  const q = query(
    collection(db, 'activity_log'), 
    where('leadId', '==', leadId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
    callback(logs);
  }, (error) => handleFirestoreError(error, 'LIST', 'activity_log'));
};

// Users (for assignment)
export const getUsers = async () => {
  let users: UserProfile[] = [];
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    
    // SAFE PATCH: Store globally for display fallbacks
    (window as any).usersList = users;
  } catch (error) {
    console.error("Failed to fetch users from collection:", error);
  }
    
  // Ensure current user is in the list if they have a profile
  const currentUser = auth.currentUser;
  if (currentUser && !(users || []).find(u => u.uid === currentUser.uid)) {
    try {
      const profileSnap = await getDoc(doc(db, 'users', currentUser.uid));
      if (profileSnap.exists()) {
        const profileData = { uid: profileSnap.id, ...profileSnap.data() } as UserProfile;
        users.push(profileData);
        // Update global list too
        (window as any).usersList = [...(window as any).usersList || [], profileData];
      }
    } catch (e) {
      console.error("Failed to fetch current user profile:", e);
    }
  }
  
  return users;
};

export const createUser = async (userData: { name: string, email?: string, username: string, mobile?: string, role?: UserRole, password?: string }) => {
  try {
    const trimmedUsername = userData.username.trim().toLowerCase();
    
    // Check if username already exists
    const q = query(collection(db, 'users'), where('username', '==', trimmedUsername));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error('Username already taken');
    }

    const now = new Date().toISOString();
    const uid = Math.random().toString(36).substring(2, 15);
    const trimmedEmail = userData.email?.trim().toLowerCase() || null;
    const trimmedMobile = userData.mobile?.trim() || null;
    const trimmedPassword = (userData.password || '123456').trim();

    const newProfile: UserProfile = {
      uid,
      name: userData.name.trim(),
      email: trimmedEmail as string,
      username: trimmedUsername,
      mobile: trimmedMobile as string,
      role: userData.role || 'user',
      password: trimmedPassword,
      mustChangePassword: true,
      createdAt: now
    };
    
    await setDoc(doc(db, 'users', uid), newProfile);
    return uid;
  } catch (error: any) {
    if (error.message === 'Username already taken') throw error;
    handleFirestoreError(error, 'CREATE', 'users');
  }
};

export const deleteUser = async (uid: string) => {
  try {
    await deleteDoc(doc(db, 'users', uid));
    return true;
  } catch (error: any) {
    handleFirestoreError(error, 'DELETE', `users/${uid}`);
  }
};

export const updateProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    await updateDoc(doc(db, 'users', uid), data);
    return true;
  } catch (error: any) {
    handleFirestoreError(error, 'UPDATE', `users/${uid}`);
  }
};

// Statuses
export const subscribeStatuses = (callback: (statuses: StatusConfig[]) => void) => {
  const q = query(collection(db, 'statuses'), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const statuses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StatusConfig));
    callback(statuses);
  }, (error) => handleFirestoreError(error, 'LIST', 'statuses'));
};

export const createStatus = async (status: Omit<StatusConfig, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'statuses'), status);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, 'CREATE', 'statuses');
  }
};

export const updateStatus = async (id: string, data: Partial<StatusConfig>) => {
  try {
    await updateDoc(doc(db, 'statuses', id), data);
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `statuses/${id}`);
  }
};

export const deleteStatus = async (id: string) => {
  try {
    // Check if status is in use
    const q = query(collection(db, 'leads'), where('status', '==', id));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error(`Cannot delete status "${id}" as it is currently assigned to ${snapshot.size} leads.`);
    }
    await deleteDoc(doc(db, 'statuses', id));
  } catch (error: any) {
    if (error.message.includes('Cannot delete')) throw error;
    handleFirestoreError(error, 'DELETE', `statuses/${id}`);
  }
};

export const seedStatuses = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'statuses'));
    const existingLabels = snapshot.docs.map(doc => (doc.data() as StatusConfig).label);

    const defaultStatuses: Omit<StatusConfig, 'id'>[] = [
      { label: 'New', color: 'blue', order: 1, isDefault: true },
      { label: 'Contacted', color: 'indigo', order: 2, isDefault: true },
      { label: 'Follow-up', color: 'amber', order: 3, isDefault: true },
      { label: 'Qualified', color: 'emerald', order: 4, isDefault: true },
      { label: 'Converted', color: 'green', order: 5, isDefault: true },
      { label: 'Closed', color: 'slate', order: 6, isDefault: true },
    ];

    const batch = writeBatch(db);
    let added = false;
    defaultStatuses.forEach(s => {
      if (!existingLabels.includes(s.label)) {
        // Use label as ID to prevent duplicates
        const docRef = doc(db, 'statuses', s.label);
        batch.set(docRef, s);
        added = true;
      }
    });

    if (added) {
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, 'CREATE_BULK', 'statuses');
  }
};

// Products
export const subscribeProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, 'products'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    callback(products);
  }, (error) => handleFirestoreError(error, 'LIST', 'products'));
};

export const createProduct = async (name: string, category?: string) => {
  try {
    const cleanedName = cleanProductName(name);
    
    // Validation: no codes, min 3 chars
    if (cleanedName.length < 3) {
      throw new Error('Product name must be at least 3 characters');
    }

    // Check if it's just numbers
    if (/^\d+$/.test(cleanedName)) {
      throw new Error('Product name cannot be numbers only');
    }

    // Check for codes in the name - STRICT
    const codePattern = /AV\s*\(M\)\s*\d+/i;
    const genericCodePattern = /\d{3}|\(M\)|AV\s*\(M\)/i;
    
    if (codePattern.test(name) || codePattern.test(cleanedName) || genericCodePattern.test(cleanedName)) {
      throw new Error('Product name should not contain model codes like AV (M) 001');
    }

    // Check for duplicates
    const q = query(collection(db, 'products'), where('name', '==', cleanedName));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error('Product already exists');
    }

    const docRef = await addDoc(collection(db, 'products'), {
      name: cleanedName,
      category: category || 'General',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error: any) {
    if (error.message.includes('Product')) throw error;
    handleFirestoreError(error, 'CREATE', 'products');
  }
};

export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, 'DELETE', `products/${id}`);
  }
};

export const seedProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const existingNames = snapshot.docs.map(doc => (doc.data() as Product).name);
  
      const productsToSeed = [
        { name: "Vacuum Cleaner", category: "Cleaning Machines" },
        { name: "Single Disc Machine", category: "Cleaning Machines" },
        { name: "High Speed Polisher", category: "Cleaning Machines" },
        { name: "Scrubber Dryer", category: "Cleaning Machines" },
        { name: "High Pressure Washer", category: "Cleaning Machines" },
        { name: "Sweeper", category: "Cleaning Machines" },
        { name: "Escalator Cleaner", category: "Cleaning Machines" },
        { name: "Electronic Foamer", category: "Cleaning Machines" },
        { name: "Steam Vacuum Cleaner", category: "Cleaning Machines" },
        { name: "Carpet & Upholstery Cleaner", category: "Cleaning Machines" },
        { name: "Blower", category: "Cleaning Machines" },
        { name: "Industrial Wet & Dry Vacuum Cleaner", category: "Cleaning Machines" },
        { name: "Floor Scrubber Dryer", category: "Cleaning Machines" },
        { name: "Manual Sweeper", category: "Cleaning Machines" },
        { name: "Ride-on Scrubber Dryer", category: "Cleaning Machines" }
      ];
  
      const batch = writeBatch(db);
      let added = false;
      productsToSeed.forEach(p => {
        if (!existingNames.includes(p.name)) {
          const docRef = doc(collection(db, 'products'));
          batch.set(docRef, {
            ...p,
            createdAt: new Date().toISOString()
          });
          added = true;
        }
      });
  
      if (added) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, 'CREATE_BULK', 'products');
    }
};

// Tasks
export const subscribeTasks = (callback: (tasks: Task[]) => void, role: string, uid: string) => {
    let q = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      let tasks = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Handle old field names if they exist
          title: data.title || data.taskTitle,
          status: data.status || data.taskStatus || 'pending'
        } as Task;
      });
      
      if (role === 'sales') {
        tasks = tasks.filter(t => t.assignedTo === uid || t.createdBy === uid);
      }
      
      callback(tasks);
    }, (error) => handleFirestoreError(error, 'LIST', 'tasks'));
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...task,
      createdAt: now
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, 'CREATE', 'tasks');
  }
};

export const updateTaskStatus = async (id: string, status: 'pending' | 'completed') => {
  try {
    await updateDoc(doc(db, 'tasks', id), {
      status,
      taskStatus: status, // Backward compatibility
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `tasks/${id}`);
  }
};

export const deleteTasksBulk = async (ids: string[]) => {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, 'tasks', id));
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, 'DELETE_BULK', 'tasks');
  }
};
