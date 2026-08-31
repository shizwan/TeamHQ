'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GlobalSearch from '@/components/search/GlobalSearch';
import { ShieldCheck, ChevronRight, Activity, Bell } from 'lucide-react';
import Link from 'next/link';

const ROUTE_TITLES: Record<string, { section: string; title: string }> = {
  '/dashboard': { section: 'Executive', title: 'Scoreboard' },
  '/dashboard/tasks': { section: 'Deliverables', title: 'Execution Board' },
  '/dashboard/team': { section: 'Directory', title: 'Team Tracker' },
  '/dashboard/projects': { section: 'Portfolio', title: 'Projects' },
  '/dashboard/board': { section: 'Workflow', title: 'Kanban Board' },
  '/dashboard/deadlines': { section: 'Timeline', title: 'Deadlines & ETA' },
  '/dashboard/reports': { section: 'Analytics', title: 'Monthly Reports' },
  '/dashboard/activity': { section: 'Audit', title: 'Activity Logs' },
};

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const currentRoute = ROUTE_TITLES[pathname] || {
    section: 'Workspace',
    title: pathname.split('/').filter(Boolean).pop()?.toUpperCase() || 'Dashboard',
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-6 lg:px-8 transition-all flex items-center">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Left: Breadcrumbs & Live Pulse */}
        <div className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="text-slate-400 font-medium hidden sm:inline">{currentRoute.section}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
            <span className="font-bold text-slate-900 text-sm">{currentRoute.title}</span>
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-[11px] font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live SLA Synced</span>
          </div>
        </div>

        {/* Center: Prominent Command Search Bar */}
        <div className="flex-1 max-w-md lg:max-w-xl mx-2 sm:mx-6">
          <GlobalSearch />
        </div>

        {/* Right: User Role & Quick Links */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/dashboard/activity"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer hidden md:flex items-center justify-center"
            title="Activity Audit Log"
          >
            <Activity className="w-4 h-4" />
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/90 border border-slate-200 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="capitalize">{user?.role || 'Admin'}</span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
