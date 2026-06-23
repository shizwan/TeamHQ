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
    </header>
  );
}
