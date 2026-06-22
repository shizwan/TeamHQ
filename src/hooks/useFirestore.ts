'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEMO_TEAM, DEMO_TASKS, DEMO_PROJECTS } from '@/lib/seedData';

// ─── Real-time Collection Hook ──────────────────────────────────
export function useCollection<T extends { id: string }>(
  collectionPath: string | null
): { data: T[]; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!collectionPath) {
      setTimeout(() => {
        if (active) setLoading(false);
      }, 0);
      return () => { active = false; };
    }

    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
      setTimeout(() => {
        if (!active) return;
        if (collectionPath.includes('/team')) {
          setData(DEMO_TEAM.map((m, i) => ({ id: `team-id-${i}`, ...m, createdAt: new Date().toISOString() })) as unknown as T[]);
        } else if (collectionPath.includes('/projects')) {
          setData(DEMO_PROJECTS.map((p, i) => ({ id: `project-id-${i}`, ...p, createdAt: new Date().toISOString() })) as unknown as T[]);
        } else if (collectionPath.includes('/tasks')) {
          setData(DEMO_TASKS.map((t, i) => ({ 
            id: `task-id-${i}`, 
            projectId: `project-id-${t.projectIndex}`,
            title: t.title,
            status: t.status,
            dueDate: t.dueDate,
            assigneeId: `team-id-${t.memberIndex}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })) as unknown as T[]);
        }
        setLoading(false);
      }, 0);
      return;
    }

    setTimeout(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
    }, 0);

    const ref = collection(db, collectionPath);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore error on ${collectionPath}:`, err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionPath]);

  return { data, loading, error };
}

// ─── Add Document Hook ──────────────────────────────────────────
export function useAddDoc(
  collectionPath: string | null
): {
  addDocument: (data: DocumentData) => Promise<string | null>;
  loading: boolean;
  error: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDocument = useCallback(
    async (data: DocumentData): Promise<string | null> => {
      if (!collectionPath) return null;

      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
        // Simulate network delay and return a random ID
        await new Promise(r => setTimeout(r, 500));
        return `demo-new-id-${Date.now()}`;
      }

      setLoading(true);
      setError(null);

      try {
        const ref = collection(db, collectionPath);
        const docRef = await addDoc(ref, data);
        return docRef.id;
      } catch (err) {
        console.error('Failed to add document:', err);
        setError('Failed to save. Please try again.');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [collectionPath]
  );

  return { addDocument, loading, error };
}

// ─── Update Document Hook ───────────────────────────────────────
export function useUpdateDoc(
  collectionPath: string | null
): {
  updateDocument: (docId: string, data: Partial<DocumentData>) => Promise<boolean>;
  loading: boolean;
  error: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDocument = useCallback(
    async (docId: string, data: Partial<DocumentData>): Promise<boolean> => {
      if (!collectionPath) return false;

      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
        await new Promise(r => setTimeout(r, 500));
        return true;
      }

      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, collectionPath, docId);
        await updateDoc(docRef, data);
        return true;
      } catch (err) {
        console.error('Failed to update document:', err);
        setError('Failed to update. Please try again.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collectionPath]
  );

  return { updateDocument, loading, error };
}

// ─── Delete Document Hook ───────────────────────────────────────
export function useDeleteDoc(
  collectionPath: string | null
): {
  deleteDocument: (docId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = useCallback(
    async (docId: string): Promise<boolean> => {
      if (!collectionPath) return false;

      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-key') {
        await new Promise(r => setTimeout(r, 500));
        return true;
      }

      setLoading(true);
      setError(null);

      try {
        const docRef = doc(db, collectionPath, docId);
        await deleteDoc(docRef);
        return true;
      } catch (err) {
        console.error('Failed to delete document:', err);
        setError('Failed to delete. Please try again.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [collectionPath]
  );

  return { deleteDocument, loading, error };
}
