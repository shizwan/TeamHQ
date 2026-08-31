'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Users,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Calendar,
  Kanban,
  FileText,
  Command,
  CornerDownLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import {
  getTeamCollectionPath,
  getTasksCollectionPath,
  getProjectsCollectionPath,
} from '@/lib/firestorePaths';
import { filterActiveTasks } from '@/lib/trackerEngine';
import type { TeamMember, Task, Project } from '@/types';
import { STATUS_STYLES } from '@/types';

type SearchCategory = 'all' | 'tasks' | 'team' | 'projects' | 'pages';

interface SearchResultItem {
  id: string;
  category: 'tasks' | 'team' | 'projects' | 'pages';
  title: string;
  subtitle: string;
  meta?: string;
  badge?: string;
  badgeColor?: string;
  tag?: string;
  href: string;
  iconType: 'task' | 'team' | 'project' | 'page';
}

const STATIC_PAGES: SearchResultItem[] = [
  {
    id: 'page-dashboard',
    category: 'pages',
    title: 'Executive Scoreboard & Dashboard',
    subtitle: 'Overview of team performance metrics, deliverable delays, and portfolio health',
    badge: 'Scoreboard',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    href: '/dashboard',
    iconType: 'page',
  },
  {
    id: 'page-team',
    category: 'pages',
    title: 'Team Tracker & Performance Matrix',
    subtitle: 'Manage team roster, on-time delivery rates, and slip causes',
    badge: 'Directory',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    href: '/dashboard/team',
    iconType: 'page',
  },
  {
    id: 'page-projects',
    category: 'pages',
    title: 'Projects Portfolio',
    subtitle: 'Monitor active and archived project roadmaps and deliverables',
    badge: 'Portfolio',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/60',
    href: '/dashboard/projects',
    iconType: 'page',
  },
  {
    id: 'page-tasks',
    category: 'pages',
    title: 'Task Execution Board (15-Column View)',
    subtitle: 'Global spreadsheet and card view of all active deliverables',
    badge: 'Spreadsheet',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/60',
    href: '/dashboard/tasks',
    iconType: 'page',
  },
  {
    id: 'page-board',
    category: 'pages',
    title: 'Kanban Board',
    subtitle: 'Interactive drag-and-drop workflow pipeline by status',
    badge: 'Kanban',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/60',
    href: '/dashboard/board',
    iconType: 'page',
  },
  {
    id: 'page-deadlines',
    category: 'pages',
    title: 'Deadlines & ETA Timeline',
    subtitle: 'Overdue, due today, and upcoming 7-day deliverable radar',
    badge: 'Radar',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/60',
    href: '/dashboard/deadlines',
    iconType: 'page',
  },
  {
    id: 'page-reports',
    category: 'pages',
    title: 'Monthly Performance Reports',
    subtitle: 'Export and print executive review talking points',
    badge: 'Reports',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200/60',
    href: '/dashboard/reports',
    iconType: 'page',
  },
  {
    id: 'page-activity',
    category: 'pages',
    title: 'Activity Logs & Audit Trail',
    subtitle: 'Real-time operational event timeline and modification history',
    badge: 'Audit',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200/60',
    href: '/dashboard/activity',
    iconType: 'page',
  },
];

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.uid || '';

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Firestore collections
  const teamPath = userId ? getTeamCollectionPath(userId) : null;
  const tasksPath = userId ? getTasksCollectionPath(userId) : null;
  const projectsPath = userId ? getProjectsCollectionPath(userId) : null;

  const { data: team } = useCollection<TeamMember>(teamPath);
  const { data: tasks } = useCollection<Task>(tasksPath);
  const { data: projects } = useCollection<Project>(projectsPath);

  const activeTasks = useMemo(() => filterActiveTasks(tasks, projects), [tasks, projects]);

  const teamMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of team) map[m.id] = m.name;
    return map;
  }, [team]);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of projects) map[p.id] = p.title;
    return map;
  }, [projects]);

  // Global keyboard shortcuts: Cmd+K, Ctrl+K, or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Grouped search results
  const categorizedResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    // 1. Deliverables / Tasks
    const matchedTasks: SearchResultItem[] = activeTasks
      .filter((t) => {
        if (!q) return true;
        const assignee = (teamMap[t.assigneeId] || '').toLowerCase();
        const project = (projectMap[t.projectId] || '').toLowerCase();
        const dlvId = (t.deliverableId || '').toLowerCase();
        const title = (t.title || '').toLowerCase();
        const status = (t.status || '').toLowerCase();
        const slip = (t.slipCause || '').toLowerCase();
        return (
          title.includes(q) ||
          dlvId.includes(q) ||
          assignee.includes(q) ||
          project.includes(q) ||
          status.includes(q) ||
          slip.includes(q)
        );
      })
      .slice(0, 20)
      .map((t) => {
        const assignee = teamMap[t.assigneeId] || 'Unassigned';
        const project = projectMap[t.projectId] || 'General';
        const due = t.targetDueDate || t.dueDate
          ? new Date((t.targetDueDate || t.dueDate)!).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : '';
        const dueTime = t.targetDueTime ? ` • ${t.targetDueTime}` : '';

        return {
          id: `task-${t.id}`,
          category: 'tasks' as const,
          title: t.title,
          subtitle: `${assignee} • ${project}${due ? ` • Due: ${due}${dueTime}` : ''}`,
          meta: t.deliverableId || 'DLV',
          badge: t.status,
          badgeColor: STATUS_STYLES[t.status] || 'bg-slate-100 text-slate-700 border-slate-200/60',
          tag: project,
          href: t.assigneeId ? `/dashboard/team/${t.assigneeId}` : '/dashboard/tasks',
          iconType: 'task' as const,
        };
      });

    // 2. Team Members
    const matchedTeam: SearchResultItem[] = team
      .filter((m) => {
        if (!q) return true;
        const name = (m.name || '').toLowerCase();
        const role = (m.role || '').toLowerCase();
        const dept = (m.department || '').toLowerCase();
        return name.includes(q) || role.includes(q) || dept.includes(q);
      })
      .slice(0, 10)
      .map((m) => {
        const memberTaskCount = activeTasks.filter((t) => t.assigneeId === m.id).length;
        return {
          id: `member-${m.id}`,
          category: 'team' as const,
          title: m.name,
          subtitle: `${m.role}${m.department ? ` • ${m.department}` : ''} • ${memberTaskCount} active deliverable(s)`,
          badge: m.status || 'Active',
          badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
          href: `/dashboard/team/${m.id}`,
          iconType: 'team' as const,
        };
      });

    // 3. Projects
    const matchedProjects: SearchResultItem[] = projects
      .filter((p) => {
        if (!q) return true;
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const owner = (p.leadOwner || '').toLowerCase();
        const priority = (p.priority || '').toLowerCase();
        const status = (p.status || '').toLowerCase();
        return (
          title.includes(q) ||
          desc.includes(q) ||
          owner.includes(q) ||
          priority.includes(q) ||
          status.includes(q)
        );
      })
      .slice(0, 10)
      .map((p) => {
        const taskCount = tasks.filter((t) => t.projectId === p.id).length;
        return {
          id: `project-${p.id}`,
          category: 'projects' as const,
          title: p.title,
          subtitle: `${p.leadOwner ? `Lead: ${p.leadOwner} • ` : ''}${taskCount} deliverable(s) • ${p.description || 'Project roadmap'}`,
          badge: `${p.priority || 'Medium'} Priority`,
          badgeColor: p.status === 'Archived' ? 'bg-slate-100 text-slate-600 border border-slate-200/60' : 'bg-blue-50 text-blue-700 border border-blue-200/60',
          tag: p.status,
          href: '/dashboard/projects',
          iconType: 'project' as const,
        };
      });

    // 4. Static Pages
    const matchedPages: SearchResultItem[] = STATIC_PAGES.filter((p) => {
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        (p.badge || '').toLowerCase().includes(q)
      );
    });

    return {
      tasks: matchedTasks,
      team: matchedTeam,
      projects: matchedProjects,
      pages: matchedPages,
    };
  }, [query, activeTasks, team, projects, tasks, teamMap, projectMap]);

  // Flattened results based on activeCategory
  const flatResults = useMemo<SearchResultItem[]>(() => {
    if (activeCategory === 'tasks') return categorizedResults.tasks;
    if (activeCategory === 'team') return categorizedResults.team;
    if (activeCategory === 'projects') return categorizedResults.projects;
    if (activeCategory === 'pages') return categorizedResults.pages;

    // 'all': grouped list
    return [
      ...categorizedResults.tasks.slice(0, 8),
      ...categorizedResults.team.slice(0, 4),
      ...categorizedResults.projects.slice(0, 4),
      ...categorizedResults.pages.slice(0, 3),
    ];
  }, [activeCategory, categorizedResults]);

  const totalResultsCount = useMemo(() => {
    return (
      categorizedResults.tasks.length +
      categorizedResults.team.length +
      categorizedResults.projects.length +
      categorizedResults.pages.length
    );
  }, [categorizedResults]);

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      setIsOpen(false);
      router.push(item.href);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      }
    }
  };

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const selectedEl = listEl.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Distinct Icon Rendering with clear colors and high contrast
  const renderItemIcon = (type: SearchResultItem['iconType'], isSelected: boolean) => {
    switch (type) {
      case 'task':
        return (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              isSelected
                ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300 shadow-xs'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
          </div>
        );
      case 'team':
        return (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              isSelected
                ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300 shadow-xs'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}
          >
            <Users className="w-4 h-4" />
          </div>
        );
      case 'project':
        return (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              isSelected
                ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300 shadow-xs'
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
          </div>
        );
      case 'page':
      default:
        return (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
              isSelected
                ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300 shadow-xs'
                : 'bg-purple-50 text-purple-600 border border-purple-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </div>
        );
    }
  };

  // Grouping renderer for 'all' mode
  const renderGroupSection = (
    title: string,
    items: SearchResultItem[],
    categoryKey: SearchCategory
  ) => {
    if (items.length === 0) return null;
    return (
      <div key={title} className="mb-3">
        <div className="flex items-center justify-between px-3 py-1.5 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {title} ({items.length})
          </span>
          {activeCategory === 'all' && (
            <button
              type="button"
              onClick={() => {
                setActiveCategory(categoryKey);
                setSelectedIndex(0);
              }}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              View all
            </button>
          )}
        </div>
        <div className="space-y-1">
          {items.map((item) => {
            const idx = flatResults.findIndex((r) => r.id === item.id);
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id}
                data-index={idx}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`group flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/70 border-l-[3px] border-indigo-600 pl-3 text-slate-900 shadow-xs ring-1 ring-indigo-200/50'
                    : 'hover:bg-slate-50/90 text-slate-800 border-l-[3px] border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {renderItemIcon(item.iconType, isSelected)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.meta && (
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                          {item.meta}
                        </span>
                      )}
                      <span className="font-semibold text-sm truncate text-slate-900">
                        {item.title}
                      </span>
                      {item.tag && (
                        <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded shrink-0">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.badge && (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                        item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  <div
                    className={`flex items-center justify-center h-6 px-1.5 rounded-md border text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-300 bg-white text-indigo-600 shadow-xs'
                        : 'opacity-0 border-transparent text-slate-400'
                    }`}
                  >
                    <CornerDownLeft className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Floating Global Search Bar Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex flex-1 items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-md transition-all hover:border-indigo-300 hover:shadow-md cursor-pointer text-left focus:outline-none"
          aria-label="Open global search (Ctrl + K)"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <Search className="h-4 w-4" />
            </div>
            <div className="truncate">
              <span className="text-sm font-medium text-slate-400 group-hover:text-slate-600">
                Search deliverables, projects, teammates, DLV-IDs…
              </span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <kbd className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 shadow-2xs">
              <Command className="h-3 w-3" /> K
            </kbd>
          </div>
        </button>
      </div>

      {/* Full Modal Search Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:p-12 bg-slate-950/60 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Global Omnisearch"
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search Input Bar (Seamless, zero focus box outline) */}
            <div className="relative flex items-center border-b border-slate-100 px-4 sm:px-5 py-3.5 bg-white">
              <Search className="h-5 w-5 text-slate-400 shrink-0 mr-3.5" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                placeholder="Search anything: DLV ID, teammate, project, status…"
                className="w-full bg-transparent text-base sm:text-lg font-normal text-slate-800 placeholder:text-slate-400 border-none outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none shadow-none p-0"
                aria-label="Search query"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors mr-2 cursor-pointer"
                  aria-label="Clear query"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 border-b border-slate-100 bg-slate-50/50 overflow-x-auto text-xs scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All Results', count: totalResultsCount },
                  { id: 'tasks', label: 'Deliverables', count: categorizedResults.tasks.length },
                  { id: 'team', label: 'Team Members', count: categorizedResults.team.length },
                  { id: 'projects', label: 'Projects', count: categorizedResults.projects.length },
                  { id: 'pages', label: 'Pages & Tools', count: categorizedResults.pages.length },
                ] as const
              ).map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSelectedIndex(0);
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-all cursor-pointer whitespace-nowrap border ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Results List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto p-3 focus:outline-none"
              tabIndex={-1}
            >
              {flatResults.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 mb-3 text-slate-400">
                    <Search className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">No results found for &ldquo;{query}&rdquo;</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try searching by deliverable name, DLV ID (e.g. DLV-000001), team member, or project title.
                  </p>
                </div>
              ) : activeCategory === 'all' ? (
                <div>
                  {renderGroupSection('Deliverables', categorizedResults.tasks.slice(0, 8), 'tasks')}
                  {renderGroupSection('Team Members', categorizedResults.team.slice(0, 4), 'team')}
                  {renderGroupSection('Projects', categorizedResults.projects.slice(0, 4), 'projects')}
                  {renderGroupSection('Pages & Tools', categorizedResults.pages.slice(0, 3), 'pages')}
                </div>
              ) : (
                <div className="space-y-1">
                  {flatResults.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        data-index={idx}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`group flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/70 border-l-[3px] border-indigo-600 pl-3 text-slate-900 shadow-xs ring-1 ring-indigo-200/50'
                            : 'hover:bg-slate-50/90 text-slate-800 border-l-[3px] border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {renderItemIcon(item.iconType, isSelected)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.meta && (
                                <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                                  {item.meta}
                                </span>
                              )}
                              <span className="font-semibold text-sm truncate text-slate-900">
                                {item.title}
                              </span>
                              {item.tag && (
                                <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100/60 px-1.5 py-0.5 rounded shrink-0">
                                  {item.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold transition-colors ${
                                item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          <div
                            className={`flex items-center justify-center h-6 px-1.5 rounded-md border text-[11px] font-bold transition-all ${
                              isSelected
                                ? 'border-indigo-300 bg-white text-indigo-600 shadow-xs'
                                : 'opacity-0 border-transparent text-slate-400'
                            }`}
                          >
                            <CornerDownLeft className="h-3.5 w-3.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer Shortcuts */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 shadow-2xs">
                    ↑
                  </kbd>
                  <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 shadow-2xs">
                    ↓
                  </kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 shadow-2xs">
                    ↵
                  </kbd>
                  <span>open</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200 shadow-2xs">
                    ESC
                  </kbd>
                  <span>close</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span>{flatResults.length} match{flatResults.length !== 1 ? 'es' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
