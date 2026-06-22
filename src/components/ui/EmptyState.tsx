'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-slate-300">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>

      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        {description}
      </p>

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.loading}
          aria-label={action.label}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {action.loading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {action.label}
        </button>
      )}
    </div>
  );
}
