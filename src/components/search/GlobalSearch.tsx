'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Activity,
  Loader2,
} from 'lucide-react';
import type { SearchResultItem } from '@/lib/services/searchService';

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
    title: 'Task Execution Board',
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
    title: 'Executive Monthly Reports',
    subtitle: 'End-of-month review summaries and exportable matrix',
    badge: 'Reports',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/60',
    href: '/dashboard/reports',
    iconType: 'page',
  },
  {
    id: 'page-activity',
    category: 'pages',
    title: 'Activity Logs & Audit Trail',
    subtitle: 'Audit trail and real-time operational event history',
    badge: 'Audit',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    href: '/dashboard/activity',
    iconType: 'page',
  },
];

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'tasks' | 'team' | 'projects' | 'pages'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serverResults, setServerResults] = useState<SearchResultItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Cmd+K / Ctrl+K / slash '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing when typing inside inputs/textareas
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) && !isOpen) {
        return;
      }

      if (((e.metaKey || e.ctrlKey) && e.key === 'k') || (!isOpen && e.key === '/')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setServerResults([]);
    }
  }, [isOpen]);

  // Debounced server-side search
  useEffect(() => {
    if (!query.trim()) {
      setServerResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&category=${selectedCategory}&limit=25`,
          {
            headers: { 'x-requested-with': 'XMLHttpRequest' },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setServerResults(data);
        }
      } catch {
        // Ignore network errors during typing
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  // Combined Results
  const filteredResults = React.useMemo(() => {
    if (!query.trim()) {
      return STATIC_PAGES;
    }

    // Filter static pages locally
    const q = query.toLowerCase().trim();
    const matchedPages = STATIC_PAGES.filter(
      (p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
    );

    if (selectedCategory === 'pages') return matchedPages;
    return [...matchedPages, ...serverResults];
  }, [query, serverResults, selectedCategory]);

  // Handle item navigation
  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      setIsOpen(false);
      router.push(item.href);
    },
    [router]
  );

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    }
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-amber-600" />;
      case 'team':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'project':
        return <FolderKanban className="w-4 h-4 text-blue-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <>
      {/* Sleek Command Search Bar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2 text-xs bg-slate-100 hover:bg-white text-slate-600 hover:text-slate-900 rounded-xl transition-all border border-slate-200 hover:border-indigo-400 hover:shadow-xs cursor-pointer group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        aria-label="Search TeamHQ (Ctrl+K or /)"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
          <span className="font-medium truncate text-slate-500 group-hover:text-slate-800 text-left">
            Search deliverables, projects, teammates, pages...
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-white rounded-md border border-slate-200 shadow-2xs group-hover:border-indigo-300">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            ref={containerRef}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <Search className="w-5 h-5 text-indigo-600 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search tasks, projects, teammates, pages..."
                className="w-full bg-transparent text-base text-slate-900 placeholder-slate-400 outline-none font-semibold"
              />
              {loading && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer border border-slate-200"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All Results' },
                { id: 'tasks', label: 'Deliverables' },
                { id: 'projects', label: 'Projects' },
                { id: 'team', label: 'Team' },
                { id: 'pages', label: 'Pages' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id as any);
                    setSelectedIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-50">
              {filteredResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  {loading ? 'Searching TeamHQ...' : `No results found for "${query}"`}
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected ? 'bg-indigo-50 border border-indigo-200/80' : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
                            item.iconType === 'task'
                              ? 'bg-amber-50 border-amber-200'
                              : item.iconType === 'team'
                              ? 'bg-emerald-50 border-emerald-200'
                              : item.iconType === 'project'
                              ? 'bg-blue-50 border-blue-200'
                              : 'bg-indigo-50 border-indigo-200'
                          }`}
                        >
                          {getIcon(item.iconType)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.tag && (
                              <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
                                {item.tag}
                              </span>
                            )}
                            <span className="font-bold text-sm text-slate-900 truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 text-xs text-indigo-600 font-bold shrink-0 ml-2">
                          <span>Open</span>
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              <span>Navigate with ↑ ↓ keys</span>
              <span>Press Enter ↵ to open</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
