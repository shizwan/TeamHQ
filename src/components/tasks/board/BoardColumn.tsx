'use client';

import React, { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MoreHorizontal, ArrowUpDown, ArrowDownAZ, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { Task, TaskStatus, TeamMember, Project } from '@/types';
import BoardTaskCard from './BoardTaskCard';
import BoardQuickAdd from './BoardQuickAdd';

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  team: TeamMember[];
  projects: Project[];
  teamMap: Record<string, string>;
  projectMap: Record<string, string>;
  onEdit?: (task: Task) => void;
  onDelete: (taskId: string, title: string) => void;
  onQuickAdd?: (status: TaskStatus) => void;
  onQuickComplete?: (taskId: string) => void;
}

const COLUMN_STYLES: Record<TaskStatus, { bg: string; accent: string; dot: string; headerBg: string }> = {
  Pending: {
    bg: 'bg-slate-50/80',
    accent: 'text-slate-600',
    dot: 'bg-slate-400',
    headerBg: 'bg-slate-100',
  },
  'In Progress': {
    bg: 'bg-indigo-50/40',
    accent: 'text-indigo-700',
    dot: 'bg-indigo-500',
    headerBg: 'bg-indigo-50',
  },
  Completed: {
    bg: 'bg-emerald-50/40',
    accent: 'text-emerald-700',
    dot: 'bg-emerald-500',
    headerBg: 'bg-emerald-50',
  },
  Overdue: {
    bg: 'bg-rose-50/40',
    accent: 'text-rose-700',
    dot: 'bg-rose-500',
    headerBg: 'bg-rose-50',
  },
};

export default function BoardColumn({
  status,
  tasks,
  team,
  projects,
  teamMap,
  projectMap,
  onEdit,
  onDelete,
  onQuickAdd,
  onQuickComplete,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: 'column', status },
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [localSort, setLocalSort] = useState<'default' | 'name' | 'dueDate'>('default');

  const styles = COLUMN_STYLES[status];

  // Apply local sort
  const sortedTasks = React.useMemo(() => {
    const sorted = [...tasks];
    if (localSort === 'name') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (localSort === 'dueDate') {
      sorted.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
    return sorted;
  }, [tasks, localSort]);

  const taskIds = sortedTasks.map((t) => t.id);

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[320px] w-full rounded-xl border transition-all ${styles.bg} ${
        isOver
          ? 'border-indigo-400 ring-2 ring-indigo-200 shadow-lg'
          : 'border-slate-200'
      }`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${styles.headerBg}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={collapsed ? 'Expand column' : 'Collapse column'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
          <h3 className={`text-sm font-bold ${styles.accent}`}>
            {status}
          </h3>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.accent} bg-white/70`}
          >
            {tasks.length}
          </span>
        </div>

        {/* Column menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
            aria-label="Column options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5">
                <button
                  type="button"
                  onClick={() => { setLocalSort('dueDate'); setMenuOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${localSort === 'dueDate' ? 'text-indigo-600 font-semibold' : 'text-slate-700'}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort by due date
                </button>
                <button
                  type="button"
                  onClick={() => { setLocalSort('name'); setMenuOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${localSort === 'name' ? 'text-indigo-600 font-semibold' : 'text-slate-700'}`}
                >
                  <ArrowDownAZ className="w-3.5 h-3.5" />
                  Sort by name
                </button>
                <button
                  type="button"
                  onClick={() => { setLocalSort('default'); setMenuOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-slate-50 transition-colors ${localSort === 'default' ? 'text-indigo-600 font-semibold' : 'text-slate-700'}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Default order
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  type="button"
                  onClick={() => { setCollapsed(!collapsed); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {collapsed ? 'Expand column' : 'Collapse column'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task List (collapsible) */}
      {!collapsed && (
        <>
          <div
            ref={setNodeRef}
            className="flex-1 flex flex-col gap-2 p-3 min-h-[120px] overflow-y-auto max-h-[calc(100vh-320px)]"
          >
            <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
              {sortedTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <p className="text-xs text-slate-400 italic">
                    Drop tasks here
                  </p>
                </div>
              ) : (
                sortedTasks.map((task) => (
                  <BoardTaskCard
                    key={task.id}
                    task={task}
                    assigneeName={teamMap[task.assigneeId] ?? 'Unknown'}
                    projectName={projectMap[task.projectId]}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onQuickComplete={onQuickComplete}
                  />
                ))
              )}
            </SortableContext>
          </div>

          {/* Quick Add */}
          {onQuickAdd && (
            <div className="px-3 pb-3">
              <button
                type="button"
                onClick={() => onQuickAdd(status)}
                className="flex items-center gap-1.5 w-full px-3 py-2 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Card
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
