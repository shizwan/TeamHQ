'use client';

import React from 'react';

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-8 w-8 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-7 w-16 bg-slate-200 rounded mt-3" />
      <div className="h-3 w-32 bg-slate-100 rounded mt-2" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 bg-slate-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-4 w-16 bg-slate-200 rounded-full" />
      </div>
      <div className="h-3 w-48 bg-slate-100 rounded" />
      <div className="h-8 bg-slate-100 rounded-xl mt-4" />
    </div>
  );
}
