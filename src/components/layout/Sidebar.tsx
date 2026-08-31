'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  CheckSquare,
  FileText,
  LogOut,
  Menu,
  X,
  FolderKanban,
  Calendar,
  Kanban,
  Activity,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

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
  { label: 'Board', href: '/dashboard/board', icon: <Kanban className="h-5 w-5" /> },
  { label: 'Deadlines', href: '/dashboard/deadlines', icon: <Calendar className="h-5 w-5" /> },
  { label: 'Monthly Reports', href: '/dashboard/reports', icon: <FileText className="h-5 w-5" /> },
  { label: 'Activity Logs', href: '/dashboard/activity', icon: <Activity className="h-5 w-5" /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isCollapsed, toggleCollapse } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

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

  const renderSidebarContent = (isMobile: boolean = false) => {
    const collapsed = !isMobile && isCollapsed;

    return (
      <div className="flex h-full flex-col bg-slate-900 text-slate-300 transition-all duration-300">
        {/* Header */}
        <div
          className={`flex items-center border-b border-slate-800 transition-all duration-300 ${
            collapsed ? 'p-4 justify-center flex-col gap-3' : 'p-5 justify-between'
          }`}
        >
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-sm border border-slate-700/50 shrink-0">
              <Image
                src="/logo.png"
                alt="TeamHQ Icon"
                fill
                sizes="40px"
                className="object-cover scale-[1.65]"
                priority
              />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                TeamHQ
              </span>
            )}
          </div>

          {/* Desktop Collapse / Expand Button */}
          {!isMobile && (
            <button
              type="button"
              onClick={toggleCollapse}
              className={`rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer ${
                collapsed ? 'w-full flex justify-center bg-slate-800/60' : ''
              }`}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              type="button"
              onClick={closeMobile}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:hidden cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 space-y-1.5 py-4 overflow-y-auto ${
            collapsed ? 'px-2' : 'px-3'
          }`}
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                title={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center rounded-xl font-medium transition-all ${
                  collapsed
                    ? 'justify-center p-3 text-center'
                    : 'gap-3 px-3.5 py-2.5 text-sm'
                } ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className="shrink-0 transition-transform group-hover:scale-110" aria-hidden="true">
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-slate-800 transition-all ${collapsed ? 'p-3' : 'p-4'}`}>
          <div
            className={`mb-3 flex items-center ${
              collapsed ? 'justify-center' : 'gap-3'
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-2xs">
              {(user?.email?.[0] ?? 'U').toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-200">
                  {user?.email ?? 'User'}
                </p>
                <p className="text-xs text-slate-500">Team Manager</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            title={collapsed ? 'Sign Out' : undefined}
            className={`flex w-full items-center rounded-xl text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-rose-400 cursor-pointer ${
              collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2'
            }`}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={toggleMobile}
        className="fixed left-4 top-4 z-30 rounded-xl bg-slate-900 p-2.5 text-white shadow-lg transition-colors hover:bg-slate-800 md:hidden cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
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
        {renderSidebarContent(true)}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col h-screen sticky top-0 flex-shrink-0 z-30 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
        aria-label="Desktop navigation"
      >
        {renderSidebarContent(false)}
      </aside>

      <ConfirmDialog
        open={showSignOutConfirm}
        title="Sign out of TeamHQ?"
        description="Are you sure you want to sign out? You will need to log back in to access your dashboard."
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={() => {
          setShowSignOutConfirm(false);
          signOut();
        }}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </>
  );
}
