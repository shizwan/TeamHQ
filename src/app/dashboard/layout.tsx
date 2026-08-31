'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import GlobalSearch from '@/components/search/GlobalSearch';
import ToastContainer from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.replace('/login');
    }
  }, [mounted, user, loading, router]);

  if (!mounted || loading) {
    return (
      <div suppressHydrationWarning>
        <LoadingSpinner fullScreen message="Connecting to TeamHQ..." />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" suppressHydrationWarning>
      <Sidebar />
      <main className="flex-1 md:ml-64 min-h-screen" suppressHydrationWarning>
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-12" suppressHydrationWarning>
          <GlobalSearch />
          {children}
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
