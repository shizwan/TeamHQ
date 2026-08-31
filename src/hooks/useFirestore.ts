'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { useCallback, useState } from 'react';

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    headers: {
      'x-requested-with': 'XMLHttpRequest',
    },
  });
  if (!res.ok) {
    let errMsg = 'Failed to fetch data';
    try {
      const errJson = await res.json();
      errMsg = errJson.error || errJson.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return await res.json();
};

/**
 * Enhanced useCollection hook powered by SWR caching & deduplication
 */
export function useCollection<T>(apiEndpoint: string | null) {
  const { data, error, isLoading, mutate } = useSWR<T[]>(
    apiEndpoint,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
      fallbackData: [],
    }
  );

  const refetch = useCallback(async () => {
    if (apiEndpoint) {
      await mutate();
    }
  }, [apiEndpoint, mutate]);

  return {
    data: Array.isArray(data) ? data : [],
    loading: isLoading,
    error: error ? error.message : null,
    refetch,
    mutate,
  };
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
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        },
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
      // Invalidate relevant SWR caches
      globalMutate(apiEndpoint);
      globalMutate('/api/dashboard/metrics');
      globalMutate('/api/activity');
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
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        },
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

      // Invalidate caches
      globalMutate(apiEndpoint);
      globalMutate(`${apiEndpoint}/${id}`);
      globalMutate('/api/dashboard/metrics');
      globalMutate('/api/activity');
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
        headers: {
          'x-requested-with': 'XMLHttpRequest',
        },
      });

      if (!res.ok) {
        let errMsg = 'Failed to delete document';
        try {
          const errJson = await res.json();
          errMsg = errJson.error || errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      // Invalidate caches
      globalMutate(apiEndpoint);
      globalMutate('/api/dashboard/metrics');
      globalMutate('/api/activity');
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
