'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  CheckSquare,
  FileText,
  LogOut,
  Menu,
  X,
  FolderKanban,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <BarChart3 className="h-5 w-5" /> },
  { label: 'Team Tracker', href: '/dashboard/team', icon: <Users className="h-5 w-5" /> },
  { label: 'Projects', href: '/dashboard/projects', icon: <FolderKanban className="h-5 w-5" /> },
  { label: 'Tasks', href: '/dashboard/tasks', icon: <CheckSquare className="h-5 w-5" /> },
  { label: 'Deadlines', href: '/dashboard/deadlines', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Monthly Reports', href: '/dashboard/reports', icon: <FileText className="h-5 w-5" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 text-indigo-400" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight text-white">TeamHQ</span>
        </div>
        {/* Mobile close button */}
        <button
          type="button"
          onClick={closeMobile}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {(user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {user?.email ?? 'User'}
            </p>
            <p className="text-xs text-slate-500">Team Manager</p>
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={toggleMobile}
        className="fixed left-4 top-4 z-30 rounded-lg bg-slate-900 p-2 text-white shadow-lg transition-colors hover:bg-slate-800 md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={closeMobile}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeMobile();
          }}
          role="button"
          tabIndex={-1}
          aria-label="Close navigation overlay"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden h-screen w-64 flex-shrink-0 md:fixed md:inset-y-0 md:left-0 md:block"
        aria-label="Desktop navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
