'use client';

import { useEffect, useState, useCallback } from 'react';

// Reusing the same hook names to avoid refactoring the entire dashboard
export function useCollection<T>(apiEndpoint: string | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!apiEndpoint) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiEndpoint);
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAddDoc(apiEndpoint: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDocument = async (data: any) => {
    if (!apiEndpoint) throw new Error('No API endpoint provided');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        let errMsg = 'Failed to add document';
        try {
          const errJson = await res.json();
          errMsg = errJson.error || errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const json = await res.json();
      return json.id || json || true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addDoc: addDocument, addDocument, loading, error };
}

export function useUpdateDoc(apiEndpoint: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDocument = async (id: string, data: any) => {
    if (!apiEndpoint) throw new Error('No API endpoint provided');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiEndpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        let errMsg = 'Failed to update document';
        try {
          const errJson = await res.json();
          errMsg = errJson.error || errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateDoc: updateDocument, updateDocument, loading, error };
}

export function useDeleteDoc(apiEndpoint: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDocument = async (id: string) => {
    if (!apiEndpoint) throw new Error('No API endpoint provided');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiEndpoint}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        let errMsg = 'Failed to delete document';
        try {
          const errJson = await res.json();
          errMsg = errJson.error || errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteDoc: deleteDocument, deleteDocument, loading, error };
}
