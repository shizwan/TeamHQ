'use client';

import React, { useMemo, useState } from 'react';
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
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { calculateTeamPerformance, calculateProjectPerformance, calculateGlobalTaskMetrics, filterActiveTasks } from '@/lib/trackerEngine';
import type { TeamMember, Task, Project, SlipCause, TaskStatus } from '@/types';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/dashboard/MetricCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?.uid || 'admin-user';

  const { data: team, loading: teamLoading } = useCollection<TeamMember>(getTeamCollectionPath(userId));
  const { data: projects, loading: projectsLoading } = useCollection<Project>(getProjectsCollectionPath(userId));
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(getTasksCollectionPath(userId));

  // Filters for Live Deliverables Feed
  const [selectedMember, setSelectedMember] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedSlipCause, setSelectedSlipCause] = useState<string>('All');

  // Filter out tasks of archived projects
  const activeTasks = useMemo(() => filterActiveTasks(tasks, projects), [tasks, projects]);

  // Engine Calculations
  const teamMatrix = useMemo(() => calculateTeamPerformance(team, activeTasks), [team, activeTasks]);
  const projectMatrix = useMemo(() => calculateProjectPerformance(projects, activeTasks), [projects, activeTasks]);
  const globalMetrics = useMemo(() => calculateGlobalTaskMetrics(activeTasks), [activeTasks]);

  // Executive Callout Lists
  const topPerformers = useMemo(() => {
    return teamMatrix.filter((m) => m.performanceRating === '🟢 Top Performer' || m.onTimeRate >= 0.8).slice(0, 3);
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
    for (const p of projects) map[p.id] = p.title;
    return map;
  }, [projects]);

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

  const resetFilters = () => {
    setSelectedMember('All');
    setSelectedProject('All');
    setSelectedStatus('All');
    setSelectedSlipCause('All');
  };

  if (teamLoading || projectsLoading || tasksLoading) {
    return <LoadingSpinner message="Loading Executive Scoreboard & Performance Matrix..." />;
  }

  return (
    <>
      <Header
        title="Dev Team Scoreboard & Executive Dashboard"
        description="Real-Time Executive Monitoring Engine • Team Performance Matrix • Slip Accountability Tracking"
      />

      {/* EXECUTIVE TOP LEVEL METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard
          label="Total Deliverables"
          value={globalMetrics.total}
          icon={<Zap className="w-6 h-6 text-indigo-600" />}
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <MetricCard
          label="In Progress"
          value={globalMetrics.inProgress}
          icon={<Clock className="w-6 h-6 text-blue-500" />}
          colorClass="text-blue-600 bg-blue-50"
        />
        <MetricCard
          label="Completed"
          value={globalMetrics.completed}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <MetricCard
          label="Carried Forward"
          value={globalMetrics.carriedForward}
          icon={<AlertCircle className="w-6 h-6 text-amber-500" />}
          colorClass="text-amber-600 bg-amber-50"
        />
        <MetricCard
          label="Overdue / Delayed"
          value={globalMetrics.overdue}
          icon={<AlertCircle className="w-6 h-6 text-rose-500" />}
          colorClass="text-rose-600 bg-rose-50"
        />
      </div>

      {/* EXECUTIVE CALLOUT BANNER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Top Performers Card */}
        <div className="bg-emerald-900/10 border border-emerald-300/40 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Top Performers
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-200 text-emerald-800">
              {topPerformers.length} Active
            </span>
          </div>
          <div className="space-y-2.5">
            {topPerformers.map((m) => (
              <div key={m.id} className="flex justify-between items-center bg-white/80 p-2.5 rounded-xl border border-emerald-100 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-500">{m.role}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                  {Math.round(m.onTimeRate * 100)}% On-Time
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Required Callout */}
        <div className="bg-rose-900/10 border border-rose-300/40 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" /> Action Required ({actionRequiredMembers.length})
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-200 text-rose-800">
              Slips / Delayed
            </span>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {actionRequiredMembers.map((m) => (
              <div key={m.id} className="flex justify-between items-center bg-white/80 p-2.5 rounded-xl border border-rose-100 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {m.slipsLogged} Slips • {m.carriedForward} Carried Fwd
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-rose-100 text-rose-800 rounded-lg">
                  🔴 Action Required
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Health Summary */}
        <div className="bg-indigo-900/10 border border-indigo-300/40 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4" /> Project Portfolio Status
            </span>
            <Link href="/dashboard/projects" className="text-xs font-semibold text-indigo-600 hover:underline flex items-center">
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {projectMatrix.slice(0, 4).map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-white/80 p-2.5 rounded-xl border border-indigo-100 shadow-sm">
                <div className="truncate pr-2">
                  <p className="text-sm font-semibold text-slate-800 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.activeTasks} Active Tasks • {p.priority} Priority</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg whitespace-nowrap">
                  {p.health}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TEAM PERFORMANCE MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Team Performance Matrix & Accountability Roster
          </h2>
          <span className="text-xs text-slate-500">Auto-updated based on deliverable slip causes & ETA delays</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Team Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Manager</th>
                <th className="py-3.5 px-4 text-center">Active Tasks</th>
                <th className="py-3.5 px-4 text-center">Completed</th>
                <th className="py-3.5 px-4 text-center">On-Time Rate %</th>
                <th className="py-3.5 px-4 text-center">Carried Fwd</th>
                <th className="py-3.5 px-4 text-center">Slips Logged</th>
                <th className="py-3.5 px-4 text-center">Performance Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {teamMatrix.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                  <td className="py-3 px-4 text-slate-600">{row.role}</td>
                  <td className="py-3 px-4 text-slate-500">{row.manager}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">{row.activeTasks}</td>
                  <td className="py-3 px-4 text-center font-semibold text-emerald-600">{row.completedTasks}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${row.onTimeRate >= 0.8 ? 'bg-emerald-100 text-emerald-800' : (row.onTimeRate >= 0.5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}`}>
                      {Math.round(row.onTimeRate * 100)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-amber-600">{row.carriedForward}</td>
                  <td className="py-3 px-4 text-center font-semibold text-rose-600">{row.slipsLogged}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${row.performanceRating === '🟢 Top Performer' ? 'bg-emerald-100 text-emerald-800' : (row.performanceRating === '🔴 Action Required' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700')}`}>
                      {row.performanceRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DYNAMIC MULTI-FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Live Deliverables Audit & Filter Engine</h2>
          </div>
          {(selectedMember !== 'All' || selectedProject !== 'All' || selectedStatus !== 'All' || selectedSlipCause !== 'All') && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors self-start md:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Member Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Team Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            >
              <option value="All">All Members ({team.length})</option>
              {team.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Project</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            >
              <option value="All">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.title}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
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
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Slip Cause</label>
            <select
              value={selectedSlipCause}
              onChange={(e) => setSelectedSlipCause(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
            >
              <option value="All">All Slip Causes</option>
              <option value="N/A">N/A</option>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-xs">
                {filteredTasks.map((t) => {
                  const memberName = memberMap[t.assigneeId] || 'Unassigned';
                  const projectTitle = projectMap[t.projectId] || 'General';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {t.deliverableId || 'DLV-000000'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">{memberName}</td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{projectTitle}</td>
                      <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">{t.title}</td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.startDate ? new Date(t.startDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {t.targetDueDate ? `${new Date(t.targetDueDate).toLocaleDateString()} ${t.targetDueTime || ''}` : '-'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          t.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          t.status === 'Carried Forward' ? 'bg-amber-100 text-amber-800' :
                          t.status === 'Blocked' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.status}
                        </span>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
