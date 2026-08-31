'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Edit3,
  Trash2,
  Archive,
  RefreshCw,
  Clock,
  User,
  FolderKanban,
  CheckSquare,
  Users,
  Calendar,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { useToast } from '@/contexts/ToastContext';
import { getActivityCollectionPath } from '@/lib/firestorePaths';
import type { ActivityLog } from '@/types';

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || '';

  const activityPath = userId ? getActivityCollectionPath(userId) : null;
  const { data: logs, loading, error, refetch } = useCollection<ActivityLog>(activityPath);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Reset Filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedEntity('all');
    setSelectedAction('all');
    setSelectedDateRange('all');
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedEntity !== 'all' ||
    selectedAction !== 'all' ||
    selectedDateRange !== 'all';

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = logs.length;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let todayCount = 0;
    let completedCount = 0;
    let statusChangeCount = 0;
    let projectUpdateCount = 0;

    for (const log of logs) {
      const logTime = new Date(log.createdAt).getTime();
      if (logTime >= todayStart) todayCount++;
      if (log.action === 'completed') completedCount++;
      if (log.action === 'status_changed') statusChangeCount++;
      if (log.entityType === 'project') projectUpdateCount++;
    }

    return { total, todayCount, completedCount, statusChangeCount, projectUpdateCount };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const q = searchQuery.toLowerCase().trim();

    return logs.filter((log) => {
      // 1. Entity Filter
      if (selectedEntity !== 'all' && log.entityType !== selectedEntity) {
        return false;
      }

      // 2. Action Filter
      if (selectedAction !== 'all') {
        if (selectedAction === 'status_changes' && log.action !== 'status_changed') return false;
        if (selectedAction === 'created' && log.action !== 'created') return false;
        if (selectedAction === 'completed' && log.action !== 'completed') return false;
        if (selectedAction === 'updated' && log.action !== 'updated') return false;
        if (selectedAction === 'deleted_archived' && !['deleted', 'archived'].includes(log.action)) return false;
      }

      // 3. Date Range Filter
      if (selectedDateRange !== 'all') {
        const logTime = new Date(log.createdAt).getTime();
        if (selectedDateRange === 'today' && now - logTime > dayMs) return false;
        if (selectedDateRange === '7days' && now - logTime > 7 * dayMs) return false;
        if (selectedDateRange === '30days' && now - logTime > 30 * dayMs) return false;
      }

      // 4. Keyword Search
      if (q) {
        const title = (log.entityTitle || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const actor = (log.actorName || '').toLowerCase();
        const metadata = (log.metadata || '').toLowerCase();
        if (!title.includes(q) && !details.includes(q) && !actor.includes(q) && !metadata.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedEntity, selectedAction, selectedDateRange, searchQuery]);

  // Pagination
  const {
    currentPage,
    totalPages,
    currentItems: paginatedLogs,
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    startItem,
    endItem,
  } = usePagination(filteredLogs, 25);

  // Group paginated logs chronologically
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: ActivityLog[] } = {
      Today: [],
      Yesterday: [],
      'Earlier This Week': [],
      'Previous Weeks': [],
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    for (const log of paginatedLogs) {
      const logTime = new Date(log.createdAt).getTime();
      if (logTime >= todayStart) {
        groups.Today.push(log);
      } else if (logTime >= yesterdayStart) {
        groups.Yesterday.push(log);
      } else if (logTime >= weekStart) {
        groups['Earlier This Week'].push(log);
      } else {
        groups['Previous Weeks'].push(log);
      }
    }

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [paginatedLogs]);

  // Clear Logs Handler
  const handleClearLogs = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/activity', { method: 'DELETE' });
      if (res.ok) {
        addToast('success', 'Audit Logs Cleared', 'All activity event records have been truncated.');
        refetch();
      } else {
        addToast('error', 'Clear Failed', 'Could not clear activity logs.');
      }
    } catch (err) {
      addToast('error', 'Network Error', 'Failed to connect to activity service.');
    } finally {
      setClearing(false);
      setShowClearConfirm(false);
    }
  };

  // Helper: Action Badge & Icon
  const getActionBadge = (log: ActivityLog) => {
    switch (log.action) {
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          containerBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          label: 'Completed',
        };
      case 'status_changed':
        return {
          icon: <RefreshCw className="w-4 h-4 text-blue-600" />,
          containerBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          label: 'Status Change',
        };
      case 'created':
        return {
          icon: <PlusCircle className="w-4 h-4 text-indigo-600" />,
          containerBg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          label: 'Created',
        };
      case 'updated':
        return {
          icon: <Edit3 className="w-4 h-4 text-amber-600" />,
          containerBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          label: 'Updated',
        };
      case 'archived':
        return {
          icon: <Archive className="w-4 h-4 text-slate-600" />,
          containerBg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Archived',
        };
      case 'unarchived':
        return {
          icon: <RefreshCw className="w-4 h-4 text-emerald-600" />,
          containerBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          label: 'Restored',
        };
      case 'deleted':
        return {
          icon: <Trash2 className="w-4 h-4 text-rose-600" />,
          containerBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          label: 'Deleted',
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-slate-600" />,
          containerBg: 'bg-slate-50 text-slate-700 border-slate-200',
          label: log.action,
        };
    }
  };

  // Helper: Entity Type Badge
  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case 'task':
        return {
          icon: <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Deliverable',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
          link: '/dashboard/tasks',
        };
      case 'project':
        return {
          icon: <FolderKanban className="w-3.5 h-3.5 text-blue-600" />,
          label: 'Project',
          bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
          link: '/dashboard/projects',
        };
      case 'team_member':
        return {
          icon: <Users className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Team Member',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          link: '/dashboard/team',
        };
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-slate-600" />,
          label: 'System',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          link: '/dashboard',
        };
    }
  };

  // Helper: Format Time
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading && logs.length === 0) {
    return <LoadingSpinner fullScreen message="Loading activity logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-indigo-600" />
            Activity Logs & Audit Trail
          </h1>
          <p className="mt-1 text-slate-500 text-sm md:text-base">
            Comprehensive audit trail and real-time operational event history across TeamHQ
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              refetch();
              addToast('info', 'Refreshed', 'Activity log stream updated.');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* KPI Overview Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Logged Events
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.total}</p>
          <p className="text-xs text-slate-500 mt-1">Recorded operational audit actions</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions Today
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">{metrics.todayCount}</p>
          <p className="text-xs text-slate-500 mt-1">Active updates since midnight</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Deliverables Shipped
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{metrics.completedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Completed deliverable sign-offs</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status & Slips Logged
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{metrics.statusChangeCount}</p>
          <p className="text-xs text-slate-500 mt-1">Workflow state transitions</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Keyword Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, DLV ID, actor, details..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Actions</option>
              <option value="status_changes">Status Changes</option>
              <option value="completed">Completions</option>
              <option value="created">Creations</option>
              <option value="updated">Updates</option>
              <option value="deleted_archived">Deletions & Archives</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Entity Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none text-xs">
          <span className="text-slate-400 font-semibold mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Entity:
          </span>
          {[
            { id: 'all', label: 'All Entities' },
            { id: 'task', label: 'Deliverables (Tasks)' },
            { id: 'project', label: 'Projects' },
            { id: 'team_member', label: 'Team Members' },
          ].map((cat) => {
            const isActive = selectedEntity === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedEntity(cat.id)}
                className={`rounded-full px-3 py-1 font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Event Stream */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-8 w-8 text-slate-400" />}
          title="No activity events found"
          description={
            hasActiveFilters
              ? 'No logged actions match your search query and filters.'
              : 'There are no operational activity events recorded yet.'
          }
          action={
            hasActiveFilters
              ? {
                  label: 'Clear All Filters',
                  onClick: resetFilters,
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {groupedLogs.map(([period, items]) => (
            <div key={period} className="space-y-3">
              {/* Period Header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {period} ({items.length})
                </div>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Event Cards */}
              <div className="space-y-2.5">
                {items.map((log) => {
                  const actionStyle = getActionBadge(log);
                  const entityStyle = getEntityBadge(log.entityType);

                  let parsedMetadata: any = null;
                  try {
                    if (log.metadata) parsedMetadata = JSON.parse(log.metadata);
                  } catch (e) {}

                  return (
                    <div
                      key={log.id}
                      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                    >
                      {/* Left: Icon + Content */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${actionStyle.containerBg} shadow-2xs mt-0.5`}
                        >
                          {actionStyle.icon}
                        </div>

                        <div className="min-w-0 flex-1">
                          {/* Top Row: Entity badge + Title + Action */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${entityStyle.bg}`}
                            >
                              {entityStyle.icon}
                              {entityStyle.label}
                            </span>

                            {parsedMetadata?.deliverableId && (
                              <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {parsedMetadata.deliverableId}
                              </span>
                            )}

                            <span className="font-bold text-sm text-slate-900 truncate">
                              {log.entityTitle}
                            </span>

                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${actionStyle.containerBg}`}
                            >
                              {actionStyle.label}
                            </span>
                          </div>

                          {/* Details description */}
                          {log.details && (
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                              {log.details}
                            </p>
                          )}

                          {/* Metadata chips */}
                          <div className="flex items-center gap-3 flex-wrap mt-2 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <strong className="text-slate-700">{log.actorName}</strong>
                            </span>

                            {parsedMetadata?.projectName && (
                              <span className="flex items-center gap-1">
                                <FolderKanban className="w-3 h-3 text-slate-400" />
                                <span>{parsedMetadata.projectName}</span>
                              </span>
                            )}

                            {parsedMetadata?.assigneeName && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>Assignee: {parsedMetadata.assigneeName}</span>
                              </span>
                            )}

                            {parsedMetadata?.delayHours !== undefined && parsedMetadata.delayHours > 0 && (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                <AlertCircle className="w-3 h-3" />
                                Delay: {parsedMetadata.delayHours} hrs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Timestamp + Quick Navigation */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-1">
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-700">
                            {formatTime(log.createdAt)}
                          </span>
                          <p className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</p>
                        </div>

                        {entityStyle.link && (
                          <Link
                            href={
                              log.entityType === 'task' && log.entityId
                                ? '/dashboard/tasks'
                                : log.entityType === 'team_member' && log.entityId
                                ? `/dashboard/team/${log.entityId}`
                                : entityStyle.link
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors opacity-80 group-hover:opacity-100"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination Toolbar */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            className="rounded-2xl border border-slate-200"
          />
        </div>
      )}

      {/* Confirmation Dialog for Clearing Logs */}
      <ConfirmDialog
        open={showClearConfirm}
        title="Clear All Activity Logs?"
        description="Are you sure you want to permanently clear all recorded operational audit events? This action cannot be undone."
        confirmLabel="Clear Audit Trail"
        variant="danger"
        onConfirm={handleClearLogs}
        onCancel={() => setShowClearConfirm(false)}
        loading={clearing}
      />
    </div>
  );
}
