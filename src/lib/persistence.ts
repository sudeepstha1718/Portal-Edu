/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { Submission } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Firestore Error types and handling based on the Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check if firebase is configured
const isFirebaseConfigured = !!(
  firebaseConfig && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "" &&
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== ""
);

let db: any = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    // Validate connection to Firestore as per SKILL.md
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Firestore client appears to be offline. Operating in cache mode.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

const LOCAL_STORAGE_KEY = 'student_submissions_data';

// Helper to get local storage data
function getLocalSubmissions(): Submission[] {
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  } catch (e) {
    console.error("Error reading from local storage:", e);
    return [];
  }
}

// Helper to set local storage data
function setLocalSubmissions(data: Submission[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error writing to local storage:", e);
  }
}

export const persistence = {
  isCloudEnabled(): boolean {
    return !!db;
  },

  async saveSubmission(submissionData: Omit<Submission, 'id' | 'createdAt'>): Promise<Submission> {
    const newSubmission: Submission = {
      ...submissionData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    if (db) {
      const path = 'submissions';
      try {
        await setDoc(doc(db, 'submissions', newSubmission.id), {
          id: newSubmission.id,
          name: newSubmission.name,
          projectName: newSubmission.projectName,
          class: newSubmission.class,
          rollNo: newSubmission.rollNo,
          screenshot: newSubmission.screenshot,
          createdAt: newSubmission.createdAt,
          projectFileName: newSubmission.projectFileName || '',
          projectFileContent: newSubmission.projectFileContent || '',
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    }

    // Always keep a backup in localStorage for immediate feedback or local testing
    const local = getLocalSubmissions();
    local.unshift(newSubmission); // add to front
    setLocalSubmissions(local);

    return newSubmission;
  },

  async getSubmissions(): Promise<Submission[]> {
    if (db) {
      const path = 'submissions';
      try {
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const results: Submission[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          results.push({
            id: docSnap.id, // Use firestore document ID as submission id
            name: data.name || '',
            projectName: data.projectName || '',
            class: data.class || '',
            rollNo: data.rollNo || '',
            screenshot: data.screenshot || '',
            createdAt: data.createdAt || Date.now(),
            projectFileName: data.projectFileName || '',
            projectFileContent: data.projectFileContent || '',
            grade: data.grade || '',
          });
        });
        return results;
      } catch (error) {
        // Fallback to local storage if query fails
        console.warn("Cloud read failed or unauthorized. Falling back to local storage.", error);
        return getLocalSubmissions();
      }
    }
    return getLocalSubmissions();
  },

  async deleteSubmission(firestoreDocIdOrLocalId: string): Promise<void> {
    if (db) {
      try {
        await deleteDoc(doc(db, 'submissions', firestoreDocIdOrLocalId));
        
        // Robust fallback: query all documents and delete if field 'id' matches
        const q = query(collection(db, 'submissions'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (data.id === firestoreDocIdOrLocalId) {
            try {
              await deleteDoc(doc(db, 'submissions', docSnap.id));
            } catch (err) {
              console.warn("Nested delete failed for matched doc:", docSnap.id, err);
            }
          }
        });
      } catch (error) {
        console.warn("Cloud delete failed. Proceeding with local removal:", error);
      }
    }

    // Also remove from local backup
    const local = getLocalSubmissions();
    const updated = local.filter(s => s.id !== firestoreDocIdOrLocalId);
    setLocalSubmissions(updated);
  },

  async updateGrade(id: string, grade: string): Promise<void> {
    if (db) {
      try {
        await setDoc(doc(db, 'submissions', id), { grade }, { merge: true });
        
        // Robust query fallback in case doc ID doesn't match id field
        const q = query(collection(db, 'submissions'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (data.id === id && docSnap.id !== id) {
            try {
              await setDoc(doc(db, 'submissions', docSnap.id), { grade }, { merge: true });
            } catch (err) {
              console.warn("Nested updateGrade failed for matched doc:", docSnap.id, err);
            }
          }
        });
      } catch (error) {
        console.warn("Cloud updateGrade failed. Proceeding local:", error);
      }
    }

    const local = getLocalSubmissions();
    const updated = local.map(s => s.id === id ? { ...s, grade } : s);
    setLocalSubmissions(updated);
  },

  /**
   * Subscribe to live submissions.
   * If Firestore is active, we listen to firestore, else we poll/return local storage updates.
   */
  subscribeSubmissions(onUpdate: (submissions: Submission[]) => void): () => void {
    if (db) {
      const path = 'submissions';
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const list: Submission[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id, // Firestore document ID
            name: data.name || '',
            projectName: data.projectName || '',
            class: data.class || '',
            rollNo: data.rollNo || '',
            screenshot: data.screenshot || '',
            createdAt: data.createdAt || Date.now(),
            projectFileName: data.projectFileName || '',
            projectFileContent: data.projectFileContent || '',
            grade: data.grade || '',
          });
        });
        onUpdate(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      });
      
      return unsubscribe;
    } else {
      // Offline fallback: call callback with initial localStorage items,
      // and set up a custom listener or simple intervals as fallback
      onUpdate(getLocalSubmissions());
      
      // Listen to storage events (if open in multiple tabs)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_KEY) {
          onUpdate(getLocalSubmissions());
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Also provide a local polling backup
      const interval = setInterval(() => {
        onUpdate(getLocalSubmissions());
      }, 1500);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }
};
