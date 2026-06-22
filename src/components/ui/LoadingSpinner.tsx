'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen ? 'min-h-screen' : 'py-12'
      }`}
      role="status"
      aria-label={message ?? 'Loading'}
    >
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      {message && (
        <p className="text-sm font-medium text-slate-500">{message}</p>
      )}
    </div>
  );
}
