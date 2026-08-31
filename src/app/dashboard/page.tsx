'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Filter,
  Users,
  FolderKanban,
  RotateCcw,
  Zap,
  Eye,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useUpdateDoc } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { calculateTeamPerformance, calculateProjectPerformance, calculateGlobalTaskMetrics, filterActiveTasks } from '@/lib/trackerEngine';
import type { TeamMember, Task, Project, SlipCause, TaskStatus } from '@/types';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/dashboard/MetricCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TaskPreviewModal from '@/components/tasks/TaskPreviewModal';
import PerformanceBarChart from '@/components/dashboard/PerformanceBarChart';
import TaskPieChart from '@/components/dashboard/TaskPieChart';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/ui/Pagination';

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.uid || 'admin-user';

  const { data: team, loading: teamLoading } = useCollection<TeamMember>(getTeamCollectionPath(userId));
  const { data: projects, loading: projectsLoading } = useCollection<Project>(getProjectsCollectionPath(userId));
  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useCollection<Task>(getTasksCollectionPath(userId));
  const { updateDocument: updateTask } = useUpdateDoc(getTasksCollectionPath(userId));

  // Filters for Live Deliverables Feed
  const [selectedMember, setSelectedMember] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSlipCause, setSelectedSlipCause] = useState<string>('All');
  const [previewTaskTarget, setPreviewTaskTarget] = useState<Task | null>(null);

  // Filter out archived projects & tasks belonging to archived projects
  const activeProjects = useMemo(() => projects.filter((p) => p.status !== 'Archived'), [projects]);
  const activeTasks = useMemo(() => filterActiveTasks(tasks, projects), [tasks, projects]);

  // Engine Calculations
  const teamMatrix = useMemo(() => calculateTeamPerformance(team, activeTasks), [team, activeTasks]);
  const projectMatrix = useMemo(() => calculateProjectPerformance(activeProjects, activeTasks), [activeProjects, activeTasks]);
  const globalMetrics = useMemo(() => calculateGlobalTaskMetrics(activeTasks), [activeTasks]);

  // Executive Callout Lists
  const topPerformers = useMemo(() => {
    return teamMatrix.filter((m) => m.performanceRating === '🟢 Top Performer' || (m.onTimeRate >= 0.8 && m.completedTasks >= 2 && m.slipsLogged === 0)).slice(0, 3);
  }, [teamMatrix]);

  const actionRequiredMembers = useMemo(() => {
    return teamMatrix.filter((m) => m.performanceRating === '🔴 Action Required' || m.slipsLogged > 0 || m.carriedForward > 0);
  }, [teamMatrix]);

  // Maps
  const memberMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of team) map[m.id] = m.name;
    return map;
  }, [team]);

  const projectMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of activeProjects) map[p.id] = p.title;
    return map;
  }, [activeProjects]);

  // Filtered Deliverables
  const filteredTasks = useMemo(() => {
    return activeTasks.filter((t) => {
      const memberName = memberMap[t.assigneeId] || '';
      const projectTitle = projectMap[t.projectId] || '';

      if (selectedMember !== 'All' && memberName !== selectedMember) return false;
      if (selectedProject !== 'All' && projectTitle !== selectedProject) return false;
      if (selectedStatus !== 'All' && t.status !== selectedStatus) return false;
      if (selectedSlipCause !== 'All' && (t.slipCause || 'N/A') !== selectedSlipCause) return false;
      return true;
    });
  }, [activeTasks, selectedMember, selectedProject, selectedStatus, selectedSlipCause, memberMap, projectMap]);

  const {
    currentItems: paginatedTasks,
    currentPage,
    totalPages,
    goToPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    startItem,
    endItem,
  } = usePagination(filteredTasks, 15);

  // Reset pagination on filter change
  useEffect(() => {
    goToPage(1);
  }, [selectedMember, selectedProject, selectedStatus, selectedSlipCause, goToPage]);

  const resetFilters = () => {
    setSelectedMember('All');
    setSelectedProject('All');
    setSelectedStatus('All');
    setSelectedSlipCause('All');
  };

  if (teamLoading || projectsLoading || tasksLoading) {
    return <LoadingSpinner fullScreen message="Crunching deliverable metrics & ETA tracking..." />;
  }

  // Key KPI numbers
  const totalDeliverables = globalMetrics.total;
  const completedDeliverables = globalMetrics.completed;
  const inProgressDeliverables = globalMetrics.inProgress;
  const carriedForwardDeliverables = globalMetrics.carriedForward;
  const overdueDeliverables = globalMetrics.overdue;
  const blockedDeliverables = globalMetrics.blocked;
  const onTimePercentage = totalDeliverables > 0
    ? Math.round(((completedDeliverables - overdueDeliverables) / Math.max(1, completedDeliverables)) * 100)
    : 100;

  return (
    <>
      <Header
        title="Executive Delivery Scoreboard"
        description="Comprehensive operational dashboard tracking deliverables, delays, and developer performance."
      />

      {/* TOP KPI OVERVIEW CARDS (7 COLUMNS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalDeliverables}</p>
          <span className="text-[11px] text-slate-400 font-medium">Active Deliverables</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{completedDeliverables}</p>
          <span className="text-[11px] text-emerald-600/80 font-medium">Shipped to date</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">{inProgressDeliverables}</p>
          <span className="text-[11px] text-blue-600/80 font-medium">Under active dev</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Carried Fwd</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{carriedForwardDeliverables}</p>
          <span className="text-[11px] text-amber-600/80 font-medium">Pushed to next sprint</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{overdueDeliverables}</p>
          <span className="text-[11px] text-rose-600/80 font-medium">Past target ETA</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Blocked</span>
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{blockedDeliverables}</p>
          <span className="text-[11px] text-purple-600/80 font-medium">Pending external items</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">On-Time %</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">
            {completedDeliverables > 0 ? `${Math.max(0, onTimePercentage)}%` : '100%'}
          </p>
          <span className="text-[11px] text-indigo-600/80 font-medium">SLA compliance</span>
        </div>
      </div>

      {/* EXECUTIVE CALLOUTS (TOP PERFORMERS & ACTION REQUIRED) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Performers Callout */}
        <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-emerald-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <TrendingUp className="w-32 h-32 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-4 h-4" /> Top Performers (Zero Slips & High On-Time Rate)
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mb-4">Engineering Delivery Champions</h3>

          {topPerformers.length === 0 ? (
            <p className="text-slate-400 text-sm">No members meet the Top Performer criteria yet.</p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 hover:bg-white/15 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-bold text-emerald-300">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{m.name}</h4>
                      <p className="text-xs text-emerald-300/80">{m.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-400">{Math.round(m.onTimeRate * 100)}% On-Time</span>
                    <p className="text-[11px] text-slate-300">{m.completedTasks} completed • 0 slips</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Required Callout */}
        <div className="bg-gradient-to-br from-rose-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-rose-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <AlertCircle className="w-32 h-32 text-rose-400" />
          </div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <AlertCircle className="w-4 h-4" /> Action Required (Slips Logged / Carried Forward)
          </div>
          <h3 className="text-xl font-black text-white tracking-tight mb-4">Delivery Blockers & Slippage Radar</h3>

          {actionRequiredMembers.length === 0 ? (
            <p className="text-emerald-400 font-semibold text-sm">All clear! No delivery slips logged across the team.</p>
          ) : (
            <div className="space-y-3">
              {actionRequiredMembers.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 hover:bg-white/15 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center font-bold text-rose-300">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{m.name}</h4>
                      <p className="text-xs text-rose-300/80">{m.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/30 text-rose-200 border border-rose-500/40">
                      {m.slipsLogged} Slips • {m.carriedForward} Carried Fwd
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.activeTasks} active tasks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VISUAL CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <PerformanceBarChart data={teamMatrix} />
        </div>
        <div className="lg:col-span-1">
          <TaskPieChart tasks={activeTasks} />
        </div>
      </div>

      {/* FILTER CONTROLS FOR THE TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Filter Live Deliverables</h3>
            {(selectedMember !== 'All' || selectedProject !== 'All' || selectedStatus !== 'All' || selectedSlipCause !== 'All') && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Members ({team.length})</option>
              {team.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Projects ({activeProjects.length})</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.title}>{p.title}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Carried Forward">Carried Forward</option>
              <option value="Blocked">Blocked</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={selectedSlipCause}
              onChange={(e) => setSelectedSlipCause(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Slip Causes</option>
              <option value="N/A">N/A (Clean)</option>
              <option value="Developer">Developer</option>
              <option value="Dependency">Dependency</option>
              <option value="Scope Drift">Scope Drift</option>
              <option value="Environment/QA">Environment/QA</option>
              <option value="Unplanned Task">Unplanned Task</option>
            </select>
          </div>
        </div>
      </div>

      {/* REAL-TIME LIVE DELIVERABLES FEED TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Live Deliverables Stream ({filteredTasks.length} matching)</h2>
          <span className="text-xs text-slate-500 font-medium">Auto-computed Days Active & Delay Hrs</span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No deliverables match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">DLV ID</th>
                  <th className="py-3 px-3">Team Member</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-4">Deliverable Name</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">Target ETA</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Slip Cause</th>
                  <th className="py-3 px-3 text-center">Days Active</th>
                  <th className="py-3 px-3 text-center">Delay (Hrs)</th>
                  <th className="py-3 px-3 text-center">Lifecycle Status</th>
                  <th className="py-3 px-3 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-xs">
                {paginatedTasks.map((t) => {
                  const memberName = memberMap[t.assigneeId] || 'Unassigned';
                  const projectTitle = projectMap[t.projectId] || 'General';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setPreviewTaskTarget(t)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-mono font-bold"
                          title="Preview deliverable details"
                        >
                          {t.deliverableId || 'DLV-000000'}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">{memberName}</td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{projectTitle}</td>
                      <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">
                        <button
                          type="button"
                          onClick={() => setPreviewTaskTarget(t)}
                          className="text-left text-slate-900 hover:text-indigo-600 cursor-pointer font-semibold max-w-full truncate block transition-colors"
                          title="Preview deliverable details"
                        >
                          {t.title}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.targetDueDate ? `${new Date(t.targetDueDate).toLocaleDateString()} ${t.targetDueTime || ''}` : '-'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              t.status === 'Carried Forward' ? 'bg-amber-100 text-amber-800' :
                                t.status === 'Blocked' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${(t.slipCause && t.slipCause !== 'N/A') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-400'
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
                        <button
                          type="button"
                          onClick={() => setPreviewTaskTarget(t)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Preview deliverable details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredTasks.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
              startItem={startItem}
              endItem={endItem}
            />
          </div>
        )}
      </div>

      <TaskPreviewModal
        isOpen={!!previewTaskTarget}
        onClose={() => setPreviewTaskTarget(null)}
        task={previewTaskTarget}
        projects={activeProjects}
        team={team}
        onStatusChange={async (taskId, newStatus) => {
          const updateData: Partial<Task> = {
            status: newStatus,
          };
          await updateTask(taskId, updateData);
          refetchTasks();
          if (previewTaskTarget && previewTaskTarget.id === taskId) {
            setPreviewTaskTarget((prev) => prev ? { ...prev, ...updateData } : null);
          }
        }}
      />
    </>
  );
}
