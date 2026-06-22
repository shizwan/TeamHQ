'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, Clock, AlertCircle, Database, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from '@/lib/firestorePaths';
import { seedDemoData } from '@/lib/seedData';
import { isOverdue } from '@/lib/validation';
import { useToast } from '@/contexts/ToastContext';
import type { TeamMember, Task, Project, TaskMetrics, PerformanceData } from '@/types';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/dashboard/MetricCard';
import TaskPieChart from '@/components/dashboard/TaskPieChart';
import PerformanceBarChart from '@/components/dashboard/PerformanceBarChart';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || '';

  const { data: team, loading: teamLoading } = useCollection<TeamMember>(
    userId ? getTeamCollectionPath(userId) : null
  );
  const { data: projects, loading: projectsLoading } = useCollection<Project>(
    userId ? getProjectsCollectionPath(userId) : null
  );
  const { data: tasks, loading: tasksLoading } = useCollection<Task>(
    userId ? getTasksCollectionPath(userId) : null
  );

  const [seeding, setSeeding] = React.useState(false);

  const metrics: TaskMetrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const overdueCount = tasks.filter(
      (t) => t.status === 'Overdue' || isOverdue(t.dueDate, t.status)
    ).length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const pending = total - completed - overdueCount - inProgress;
    return { total, completed, overdue: overdueCount, inProgress, pending: Math.max(0, pending) };
  }, [tasks]);

  const performanceData: PerformanceData[] = useMemo(() => {
    return team.map((member) => {
      const memberTasks = tasks.filter((t) => t.assigneeId === member.id);
      const completedTasks = memberTasks.filter((t) => t.status === 'Completed');
      const completed = completedTasks.length;
      const overdue = memberTasks.filter(
        (t) => t.status === 'Overdue' || isOverdue(t.dueDate, t.status)
      ).length;
      const inProgress = memberTasks.filter((t) => t.status === 'In Progress').length;
      const pending = memberTasks.length - completed - overdue - inProgress;
      const total = memberTasks.length;

      const onTimeCompleted = completedTasks.filter(t => t.completedAt && t.completedAt <= t.dueDate).length + completedTasks.filter(t => !t.completedAt).length; // assume on-time if missing timestamp
      const lateCompleted = completed - onTimeCompleted;
      const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

      let score = completionRate;
      score -= (overdue / (total || 1)) * 30; // -30% penalty
      score += (onTimeCompleted / (completed || 1)) * 10; // +10% bonus
      const efficiencyScore = total === 0 ? 0 : Math.max(0, Math.min(100, Math.round(score)));

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        department: member.department,
        createdAt: member.createdAt,
        completed,
        overdue,
        inProgress,
        pending: Math.max(0, pending),
        total,
        completionRate,
        onTimeCompleted,
        lateCompleted,
        efficiencyScore,
      };
    });
  }, [team, tasks]);

  const [nowTime, setNowTime] = React.useState(() => Date.now());

  React.useEffect(() => {
    const interval = setInterval(() => setNowTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Quick Glance: Needs Attention
  const needsAttentionTasks = useMemo(() => {
    const todayEnd = new Date(nowTime);
    todayEnd.setHours(23, 59, 59, 999);
    const todayTime = todayEnd.getTime();

    return tasks
      .filter(t => t.status !== 'Completed')
      .filter(t => {
        const dueTime = new Date(t.dueDate).getTime();
        return t.status === 'Overdue' || dueTime < nowTime || dueTime <= todayTime;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4); // top 4
  }, [tasks, nowTime]);

  // Quick Glance: Team Alerts
  const teamAlerts = useMemo(() => {
    const topPerformers = performanceData.filter(p => p.efficiencyScore >= 90).sort((a, b) => b.efficiencyScore - a.efficiencyScore).slice(0, 3);
    const needsSupport = performanceData.filter(p => p.efficiencyScore < 60 && p.total > 0).sort((a, b) => a.efficiencyScore - b.efficiencyScore).slice(0, 3);
    return { topPerformers, needsSupport };
  }, [performanceData]);

  // Quick Glance: Active Projects
  const activeProjects = useMemo(() => {
    return projects
      .filter(p => p.status === 'Active')
      .slice(0, 3)
      .map(p => {
        const pTasks = tasks.filter(t => t.projectId === p.id);
        const completed = pTasks.filter(t => t.status === 'Completed').length;
        const progress = pTasks.length === 0 ? 0 : Math.round((completed / pTasks.length) * 100);
        return { ...p, progress, totalTasks: pTasks.length };
      });
  }, [projects, tasks]);


  const handleSeedData = async () => {
    if (!userId) return;
    setSeeding(true);
    try {
      await seedDemoData(userId);
      addToast('success', 'Demo data loaded', 'Sample team and tasks have been added.');
    } catch {
      addToast('error', 'Failed to load demo data', 'Please try again.');
    } finally {
      setSeeding(false);
    }
  };

  if (teamLoading || projectsLoading || tasksLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <>
      <Header title="Dashboard" description="Overview of your team operations and progress." />

      {team.length === 0 && tasks.length === 0 && (
        <div className="mb-6">
          <EmptyState
            icon={<Database className="w-12 h-12" />}
            title="Welcome to CynoHQ!"
            description="Your workspace is empty. Start by adding team members manually, or load demo data to explore the features."
            action={{
              label: seeding ? 'Loading...' : 'Load Demo Data',
              onClick: handleSeedData,
              loading: seeding,
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Projects"
          value={projects.length}
          icon={<FileText className="w-6 h-6 text-slate-600" />}
          colorClass="text-slate-800 bg-slate-100"
        />
        <MetricCard
          label="Completed"
          value={metrics.completed}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <MetricCard
          label="In Progress"
          value={metrics.inProgress}
          icon={<Clock className="w-6 h-6 text-blue-500" />}
          colorClass="text-blue-600 bg-blue-50"
        />
        <MetricCard
          label="Overdue"
          value={metrics.overdue}
          icon={<AlertCircle className="w-6 h-6 text-rose-500" />}
          colorClass="text-rose-600 bg-rose-50"
        />
      </div>

      {/* QUICK GLANCES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Needs Attention */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Needs Attention
            </h3>
            <Link href="/dashboard/deadlines" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {needsAttentionTasks.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-8 flex flex-col items-center justify-center h-full">
                All caught up! No urgent tasks.
              </div>
            ) : (
              <ul className="space-y-3">
                {needsAttentionTasks.map(t => {
                  const assignee = team.find(m => m.id === t.assigneeId);
                  return (
                    <li key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center group">
                      <div className="truncate pr-4 w-full">
                        <p className="text-sm font-semibold text-slate-800 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {assignee ? assignee.name : 'Unassigned'} • Due {new Date(t.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Team Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Team Alerts
            </h3>
            <Link href="/dashboard/team" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
              Directory <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {teamAlerts.needsSupport.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Needs Support
                </h4>
                <ul className="space-y-2">
                  {teamAlerts.needsSupport.map(m => (
                    <li key={m.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700 truncate pr-2">{m.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700 whitespace-nowrap">
                        {m.efficiencyScore}% Eff
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {teamAlerts.topPerformers.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2 mt-4 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Top Performers
                </h4>
                <ul className="space-y-2">
                  {teamAlerts.topPerformers.map(m => (
                    <li key={m.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700 truncate pr-2">{m.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                        {m.efficiencyScore}% Eff
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {teamAlerts.needsSupport.length === 0 && teamAlerts.topPerformers.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-8 flex flex-col items-center justify-center h-full">
                Not enough data for alerts.
              </div>
            )}
          </div>
        </div>

        {/* Active Projects Snapshot */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Active Projects
            </h3>
            <Link href="/dashboard/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center">
              All Projects <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {activeProjects.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-8 flex flex-col items-center justify-center h-full">
                No active projects found.
              </div>
            ) : (
              <ul className="space-y-5 mt-2">
                {activeProjects.map(p => (
                  <li key={p.id} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-800 truncate pr-2">{p.title}</span>
                      <span className="text-xs font-bold text-slate-500">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${p.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.max(2, p.progress)}%` }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TaskPieChart metrics={metrics} />
        <PerformanceBarChart data={performanceData} />
      </div>
    </>
  );
}
