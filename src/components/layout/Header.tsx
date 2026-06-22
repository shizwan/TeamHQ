'use client';

import React from 'react';
import { Database } from 'lucide-react';

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({ title, description }: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">{title}</h1>
        <p className="mt-1 text-slate-500">{description}</p>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
        <Database className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Auto-saving to Cloud</span>
      </div>
    </header>
  );
}
