'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/layout/Sidebar';
import GlobalSearch from '@/components/search/GlobalSearch';
import ToastContainer from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isCollapsed } = useSidebar();
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row w-full max-w-full overflow-x-clip" suppressHydrationWarning>
      <Sidebar />
      <main
        className="flex-1 min-w-0 min-h-screen flex flex-col transition-all duration-300 ease-in-out"
        suppressHydrationWarning
      >
        <div className="w-full max-w-full p-4 sm:p-6 lg:p-8 pb-16 min-w-0" suppressHydrationWarning>
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
  return (
    <SidebarProvider>
      <DashboardShell>{children}</DashboardShell>
    </SidebarProvider>
  );
}
