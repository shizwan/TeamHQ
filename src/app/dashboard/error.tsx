'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[DASHBOARD ERROR CAUGHT]', error);
  }, [error]);

  return (
    <div className="p-8 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col items-center justify-center text-center space-y-4 my-8">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-800">Failed to load dashboard component</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md">
          There was an issue fetching or rendering this section. Please click below to reload the view.
        </p>
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry Loading
      </button>
    </div>
  );
}
