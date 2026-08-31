'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Filter, 
  RotateCcw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ListFilter
} from 'lucide-react';
import type { Task, TeamMember, Project, TaskStatus, SlipCause } from '@/types';
import { SLIP_CAUSES } from '@/types';
import TaskCard from '@/components/tasks/TaskCard';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

interface TaskGridProps {
  tasks: Task[];
  projects?: Project[];
  team: TeamMember[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete: (taskId: string, title: string) => void;
  onPreview?: (task: Task) => void;
}

type SortField = 'createdAt' | 'targetDueDate' | 'delayHours' | 'title' | 'deliverableId' | 'status' | 'assignee' | 'project' | 'daysActive';
type SortDirection = 'asc' | 'desc';
type TimelineFilter = 'all' | 'today' | 'week' | 'overdue' | 'completed';

export default function TaskGrid({
  tasks,
  projects = [],
  team,
  onStatusChange,
  onEdit,
  onDelete,
  onPreview,
}: TaskGridProps) {
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSlipCause, setSelectedSlipCause] = useState<string>('All');
  const [selectedTimeline, setSelectedTimeline] = useState<TimelineFilter>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Sort State
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Lookup maps
  const teamMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const member of team) {
      map[member.id] = member.name;
    }
    return map;
  }, [team]);

  const projectMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const project of projects) {
      map[project.id] = project.title;
    }
    return map;
  }, [projects]);

  // Counts for Project options
  const projectTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (t.projectId) {
        counts[t.projectId] = (counts[t.projectId] || 0) + 1;
      }
    }
    return counts;
  }, [tasks]);

  // Counts for Member options
  const memberTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasks) {
      if (t.assigneeId) {
        counts[t.assigneeId] = (counts[t.assigneeId] || 0) + 1;
      }
    }
    return counts;
  }, [tasks]);

  // Quick Preset Counts
  const quickCounts = useMemo(() => {
    const now = new Date().setHours(0, 0, 0, 0);
    return {
      all: tasks.length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      blocked: tasks.filter(t => t.status === 'Blocked').length,
      carriedForward: tasks.filter(t => t.status === 'Carried Forward').length,
      late: tasks.filter(t => (t.delayHours ?? 0) > 0 || (t.targetDueDate && new Date(t.targetDueDate).getTime() < now && t.status !== 'Completed')).length,
    };
  }, [tasks]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedProjectId('');
    setSelectedAssigneeId('');
    setSelectedStatus('All');
    setSelectedSlipCause('All');
    setSelectedTimeline('all');
    setSortField('createdAt');
    setSortDirection('desc');
  };

  const hasActiveFilters = 
    search !== '' || 
    selectedProjectId !== '' || 
    selectedAssigneeId !== '' || 
    selectedStatus !== 'All' || 
    selectedSlipCause !== 'All' || 
    selectedTimeline !== 'all';

  // Toggle sorting on column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'title' || field === 'deliverableId' || field === 'assignee' || field === 'project' ? 'asc' : 'desc');
    }
  };

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999).getTime();
    const nowTime = now.getTime();

    const filtered = tasks.filter((task) => {
      // 1. Search Query: Matches Title, Deliverable ID, Assignee Name, Project Title, Slip Cause, and Labels
      if (query) {
        const titleMatch = (task.title || '').toLowerCase().includes(query);
        const dlvMatch = (task.deliverableId || '').toLowerCase().includes(query);
        const assigneeMatch = (teamMap[task.assigneeId] || '').toLowerCase().includes(query);
        const projectMatch = (projectMap[task.projectId] || '').toLowerCase().includes(query);
        const slipMatch = (task.slipCause || '').toLowerCase().includes(query);
        const labelsStr = Array.isArray(task.labels) ? task.labels.join(' ') : (task.labels || '');
        const labelsMatch = labelsStr.toLowerCase().includes(query);

        if (!titleMatch && !dlvMatch && !assigneeMatch && !projectMatch && !slipMatch && !labelsMatch) {
          return false;
        }
      }

      // 2. Project Filter
      if (selectedProjectId && task.projectId !== selectedProjectId) {
        return false;
      }

      // 3. Assignee Filter
      if (selectedAssigneeId && task.assigneeId !== selectedAssigneeId) {
        return false;
      }

      // 4. Status Filter
      if (selectedStatus !== 'All' && task.status !== selectedStatus) {
        return false;
      }

      // 5. Slip Cause Filter
      if (selectedSlipCause !== 'All') {
        if (selectedSlipCause === 'N/A' && (task.slipCause && task.slipCause !== 'N/A')) return false;
        if (selectedSlipCause !== 'N/A' && task.slipCause !== selectedSlipCause) return false;
      }

      // 6. Timeline Filter
      if (selectedTimeline !== 'all') {
        const targetTime = task.targetDueDate || task.dueDate ? new Date(task.targetDueDate || task.dueDate!).getTime() : 0;

        if (selectedTimeline === 'today') {
          if (task.status === 'Completed' || targetTime === 0 || targetTime < nowTime - 1000 * 60 * 60 * 24 || targetTime > todayEnd) {
            return false;
          }
        } else if (selectedTimeline === 'week') {
          if (task.status === 'Completed' || targetTime === 0 || targetTime > weekEnd) {
            return false;
          }
        } else if (selectedTimeline === 'overdue') {
          const isLate = (task.delayHours ?? 0) > 0 || (targetTime > 0 && targetTime < nowTime && task.status !== 'Completed');
          if (!isLate) return false;
        } else if (selectedTimeline === 'completed') {
          if (task.status !== 'Completed') return false;
        }
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'deliverableId':
          comparison = (a.deliverableId || '').localeCompare(b.deliverableId || '');
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'assignee':
          comparison = (teamMap[a.assigneeId] || '').localeCompare(teamMap[b.assigneeId] || '');
          break;
        case 'project':
          comparison = (projectMap[a.projectId] || '').localeCompare(projectMap[b.projectId] || '');
          break;
        case 'targetDueDate': {
          const dateA = a.targetDueDate || a.dueDate ? new Date(a.targetDueDate || a.dueDate!).getTime() : 0;
          const dateB = b.targetDueDate || b.dueDate ? new Date(b.targetDueDate || b.dueDate!).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'delayHours':
          comparison = (a.delayHours || 0) - (b.delayHours || 0);
          break;
        case 'daysActive':
          comparison = (a.daysActive || 1) - (b.daysActive || 1);
          break;
        case 'createdAt':
        default: {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    tasks, 
    search, 
    selectedProjectId, 
    selectedAssigneeId, 
    selectedStatus, 
    selectedSlipCause, 
    selectedTimeline, 
    sortField, 
    sortDirection, 
    teamMap, 
    projectMap
  ]);

  const { 
    currentItems: currentTasks, 
    currentPage, 
    totalPages, 
    goToPage, 
    itemsPerPage, 
    setItemsPerPage, 
    totalItems, 
    startItem, 
    endItem 
  } = usePagination(filteredAndSorted, 15);

  useEffect(() => {
    goToPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedProjectId, selectedAssigneeId, selectedStatus, selectedSlipCause, selectedTimeline]);

  return (
    <div className="space-y-5">
      {/* 1. QUICK STATUS PRESET PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => { setSelectedStatus('All'); setSelectedTimeline('all'); }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedStatus === 'All' && selectedTimeline === 'all'
              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/10'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>All Deliverables</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            selectedStatus === 'All' && selectedTimeline === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {quickCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('In Progress'); setSelectedTimeline('all'); }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedStatus === 'In Progress' && selectedTimeline === 'all'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20'
              : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>In Progress</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            selectedStatus === 'In Progress' && selectedTimeline === 'all' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'
          }`}>
            {quickCounts.inProgress}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('Completed'); setSelectedTimeline('all'); }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedStatus === 'Completed' && selectedTimeline === 'all'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50/50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Completed</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            selectedStatus === 'Completed' && selectedTimeline === 'all' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {quickCounts.completed}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('Blocked'); setSelectedTimeline('all'); }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedStatus === 'Blocked' && selectedTimeline === 'all'
              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/20'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Blocked</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            selectedStatus === 'Blocked' && selectedTimeline === 'all' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700'
          }`}>
            {quickCounts.blocked}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('Carried Forward'); setSelectedTimeline('all'); }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedStatus === 'Carried Forward' && selectedTimeline === 'all'
              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/20'
              : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Carried Forward</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            selectedStatus === 'Carried Forward' && selectedTimeline === 'all' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700'
          }`}>
            {quickCounts.carriedForward}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedTimeline('overdue'); setSelectedStatus('All'); }}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedTimeline === 'overdue'
              ? 'bg-rose-700 text-white shadow-sm ring-2 ring-rose-700/20'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50/50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Overdue / Late</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            selectedTimeline === 'overdue' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-800'
          }`}>
            {quickCounts.late}
          </span>
        </button>
      </div>

      {/* 2. ADVANCED MULTI-FILTER CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 w-full max-w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-2 md:col-span-2 xl:col-span-2 relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, DLV-ID, member, tag..."
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-8 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              aria-label="Filter by Project"
            >
              <option value="">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({projectTaskCounts[p.id] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={selectedAssigneeId}
              onChange={(e) => setSelectedAssigneeId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              aria-label="Filter by Team Member"
            >
              <option value="">All Members ({team.length})</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({memberTaskCounts[m.id] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              aria-label="Filter by Status"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Carried Forward">Carried Forward</option>
              <option value="Blocked">Blocked</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Slip Cause Filter */}
          <div>
            <select
              value={selectedSlipCause}
              onChange={(e) => setSelectedSlipCause(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
              aria-label="Filter by Slip Cause"
            >
              <option value="All">All Slip Causes</option>
              {SLIP_CAUSES.map((cause) => (
                <option key={cause} value={cause}>
                  {cause}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Timeline, Sort, View Toggle, and Active Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeline Filter */}
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline:</span>
            </div>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
              {(['all', 'today', 'week', 'overdue', 'completed'] as TimelineFilter[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTimeline(t)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    selectedTimeline === t
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t === 'all' && 'All Time'}
                  {t === 'today' && 'Due Today'}
                  {t === 'week' && 'Next 7 Days'}
                  {t === 'overdue' && 'Overdue'}
                  {t === 'completed' && 'Done'}
                </button>
              ))}
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 text-xs text-slate-500">
              <ListFilter className="w-3.5 h-3.5" />
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('-') as [SortField, SortDirection];
                  setSortField(field);
                  setSortDirection(dir);
                }}
                className="rounded-lg border border-slate-200 bg-white py-1 px-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="targetDueDate-asc">Due Date (Urgent First)</option>
                <option value="delayHours-desc">Delay (Highest First)</option>
                <option value="title-asc">Deliverable Name (A-Z)</option>
                <option value="deliverableId-asc">DLV-ID (Ascending)</option>
                <option value="daysActive-desc">Days Active (Longest)</option>
              </select>
            </div>
          </div>

          {/* Right Side: View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Spreadsheet Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cards View
            </button>
          </div>
        </div>

        {/* 3. ACTIVE FILTER CHIPS & RESULT SUMMARY */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-500">Active filters:</span>

              {search && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                  Search: &ldquo;{search}&rdquo;
                  <button type="button" onClick={() => setSearch('')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedProjectId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                  Project: {projectMap[selectedProjectId] || 'Selected'}
                  <button type="button" onClick={() => setSelectedProjectId('')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedAssigneeId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                  Assignee: {teamMap[selectedAssigneeId] || 'Selected'}
                  <button type="button" onClick={() => setSelectedAssigneeId('')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStatus !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                  Status: {selectedStatus}
                  <button type="button" onClick={() => setSelectedStatus('All')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSlipCause !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                  Slip Cause: {selectedSlipCause}
                  <button type="button" onClick={() => setSelectedSlipCause('All')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTimeline !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
                  Timeline: {selectedTimeline}
                  <button type="button" onClick={() => setSelectedTimeline('all')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Clear All
              </button>
            </div>

            <div className="text-slate-500 font-medium ml-auto">
              Showing <span className="font-bold text-slate-800">{filteredAndSorted.length}</span> of {tasks.length} deliverables
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT (Spreadsheet Table or Card Grid) */}
      {filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 py-16 px-4 text-center">
          <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No matching deliverables found</h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            No deliverables match your search criteria or active filters. Try adjusting your filters or resetting them.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                assigneeName={teamMap[task.assigneeId] ?? 'Unknown'}
                projectName={projectMap[task.projectId]}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
          </div>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            className="rounded-2xl shadow-sm border border-slate-200"
          />
        </div>
      ) : (
        /* 15-COLUMN SPREADSHEET TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  {/* DLV ID */}
                  <th 
                    onClick={() => handleSort('deliverableId')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>DLV ID</span>
                      {sortField === 'deliverableId' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* Team Member */}
                  <th 
                    onClick={() => handleSort('assignee')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Team Member</span>
                      {sortField === 'assignee' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* Project */}
                  <th 
                    onClick={() => handleSort('project')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Project</span>
                      {sortField === 'project' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* Deliverable Name */}
                  <th 
                    onClick={() => handleSort('title')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Deliverable Name</span>
                      {sortField === 'title' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* Start Date */}
                  <th className="py-3 px-3">Start Date</th>

                  {/* Target Date */}
                  <th 
                    onClick={() => handleSort('targetDueDate')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Target Date</span>
                      {sortField === 'targetDueDate' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* ETA Time */}
                  <th className="py-3 px-3">ETA Time</th>

                  {/* Status */}
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* Slip Cause */}
                  <th className="py-3 px-3">Slip Cause</th>

                  {/* Days Active */}
                  <th 
                    onClick={() => handleSort('daysActive')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Days Active</span>
                      {sortField === 'daysActive' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* Delay (Hrs) */}
                  <th 
                    onClick={() => handleSort('delayHours')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Delay (Hrs)</span>
                      {sortField === 'delayHours' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />
                      )}
                    </div>
                  </th>

                  {/* Lifecycle Status */}
                  <th className="py-3 px-3 text-center">Lifecycle Status</th>

                  {/* Actions */}
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-xs">
                {currentTasks.map((t) => {
                  const memberName = teamMap[t.assigneeId] || 'Unassigned';
                  const projectTitle = projectMap[t.projectId] || 'General';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {onPreview ? (
                          <button
                            type="button"
                            onClick={() => onPreview(t)}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-mono font-bold"
                            title="Preview deliverable details"
                          >
                            {t.deliverableId || 'DLV-000000'}
                          </button>
                        ) : (
                          t.deliverableId || 'DLV-000000'
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">{memberName}</td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{projectTitle}</td>
                      <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">
                        {onPreview ? (
                          <button
                            type="button"
                            onClick={() => onPreview(t)}
                            className="text-left text-slate-900 hover:text-indigo-600 cursor-pointer font-semibold max-w-full truncate block transition-colors"
                            title="Preview deliverable details"
                          >
                            {t.title}
                          </button>
                        ) : (
                          t.title
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.targetDueDate || t.dueDate ? new Date((t.targetDueDate || t.dueDate)!).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.targetDueTime || '10:00 PM'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={t.status}
                          onChange={(e) => onStatusChange(t.id, e.target.value as TaskStatus)}
                          className={`rounded px-2 py-1 text-xs font-bold border ${
                            t.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            t.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                            t.status === 'Carried Forward' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            t.status === 'Blocked' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Carried Forward">Carried Forward</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          (t.slipCause && t.slipCause !== 'N/A') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-400'
                        }`}>
                          {t.slipCause || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                        {t.daysActive || 1}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap font-semibold">
                        {(t.delayHours ?? 0) > 0 ? (
                          <span className="text-rose-600 font-bold">+{t.delayHours} hrs</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                          {t.lifecycleStatus || '🟢 In Progress'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {onPreview && (
                            <button
                              type="button"
                              onClick={() => onPreview(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Preview deliverable"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(t)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit deliverable"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDelete(t.id, t.title)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Delete deliverable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
            className="border-t border-slate-100 p-4"
          />
        </div>
      )}
    </div>
  );
}
