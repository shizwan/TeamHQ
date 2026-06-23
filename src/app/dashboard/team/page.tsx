'use client';

import React, { useMemo, useCallback } from 'react';
import { Users, Briefcase, Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection, useAddDoc, useDeleteDoc, useUpdateDoc } from '@/hooks/useFirestore';
import { getTeamCollectionPath, getTasksCollectionPath } from '@/lib/firestorePaths';
import { useToast } from '@/contexts/ToastContext';
import { sanitizeString, isOverdue, calculatePerformanceData } from '@/lib/validation';
import type { TeamMember, Task, PerformanceData, NewMemberForm } from '@/types';
import Header from '@/components/layout/Header';
import TeamTable from '@/components/team/TeamTable';
import AddMemberForm from '@/components/team/AddMemberForm';
import EditMemberModal from '@/components/team/EditMemberModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MetricCard from '@/components/dashboard/MetricCard';
import PerformanceBarChart from '@/components/dashboard/PerformanceBarChart';

export default function TeamPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const userId = user?.uid || '';

  const teamPath = userId ? getTeamCollectionPath(userId) : null;
  const tasksPath = userId ? getTasksCollectionPath(userId) : null;

  const { data: team, loading: teamLoading, refetch: refetchTeam } = useCollection<TeamMember>(teamPath);
  const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useCollection<Task>(tasksPath);
  const { addDocument, loading: addingMember } = useAddDoc(teamPath);
  const { deleteDocument, loading: deletingMember } = useDeleteDoc(teamPath);
  const { updateDocument, loading: updatingMember } = useUpdateDoc(teamPath);

  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = React.useState<PerformanceData | null>(null);

  const performanceData: PerformanceData[] = useMemo(() => {
    return calculatePerformanceData(team, tasks);
  }, [team, tasks]);

  // Derived Metrics
  const totalTeamWorkload = useMemo(() => {
    return performanceData.reduce((acc, curr) => acc + curr.inProgress + curr.pending, 0);
  }, [performanceData]);

  const topPerformer = useMemo(() => {
    const active = performanceData.filter((m) => m.completed > 0);
    if (active.length === 0) return 'None';
    const sorted = [...active].sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    return sorted[0].name.split(' ')[0];
  }, [performanceData]);

  const lowestPerformer = useMemo(() => {
    const active = performanceData.filter((m) => m.total > 0 && m.efficiencyScore < 100);
    if (active.length === 0) return 'None';
    const sorted = [...active].sort((a, b) => a.efficiencyScore - b.efficiencyScore);
    return sorted[0].name.split(' ')[0];
  }, [performanceData]);

  const mostOverburdened = useMemo(() => {
    if (performanceData.length === 0) return 'N/A';
    const activeMembers = performanceData.filter((m) => m.inProgress + m.pending > 0);
    if (activeMembers.length === 0) return 'N/A';
    const sorted = [...activeMembers].sort(
      (a, b) => b.inProgress + b.pending - (a.inProgress + a.pending)
    );
    return sorted[0].name.split(' ')[0];
  }, [performanceData]);

  const mostOverdue = useMemo(() => {
    if (performanceData.length === 0) return 'N/A';
    const activeMembers = performanceData.filter((m) => m.overdue > 0);
    if (activeMembers.length === 0) return 'None';
    const sorted = [...activeMembers].sort((a, b) => b.overdue - a.overdue);
    return sorted[0].name.split(' ')[0];
  }, [performanceData]);

  const topContributor = useMemo(() => {
    const activeMembers = performanceData.filter((m) => m.completed > 0);
    if (activeMembers.length === 0) return 'None';
    const sorted = [...activeMembers].sort((a, b) => b.completed - a.completed);
    return sorted[0].name.split(' ')[0];
  }, [performanceData]);

  const availableCapacity = useMemo(() => {
    return performanceData.filter((m) => m.inProgress + m.pending === 0).length;
  }, [performanceData]);

  const handleAddMember = useCallback(
    async (data: NewMemberForm) => {
      const result = await addDocument({
        userId,
        name: sanitizeString(data.name),
        role: sanitizeString(data.role),
        department: sanitizeString(data.department),
        createdAt: new Date().toISOString(),
      });

      if (result) {
        addToast('success', 'Member added', `${sanitizeString(data.name)} has been added to the team.`);
        refetchTeam();
      } else {
        addToast('error', 'Failed to add member', 'Please try again.');
      }
    },
    [addDocument, addToast]
  );

  const handleEditMember = useCallback(
    async (id: string, data: { name: string; role: string; department: string }) => {
      const result = await updateDocument(id, data);
      if (result) {
        addToast('success', 'Member updated', `${sanitizeString(data.name)}'s details have been updated.`);
        refetchTeam();
      } else {
        addToast('error', 'Failed to update member', 'Please try again.');
      }
    },
    [updateDocument, addToast, refetchTeam]
  );

  const handleDeleteMember = useCallback(async () => {
    if (!deleteTarget) return;

    const success = await deleteDocument(deleteTarget.id);
    if (success) {
      addToast('success', 'Member removed', `${deleteTarget.name} has been removed.`);
      refetchTeam();
    } else {
      addToast('error', 'Failed to remove member', 'Please try again.');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteDocument, addToast]);

  const handleRequestDelete = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
  }, []);

  if (teamLoading || tasksLoading) {
    return <LoadingSpinner message="Loading team dashboard..." />;
  }

  const orphanedTaskCount = deleteTarget
    ? tasks.filter((t) => t.assigneeId === deleteTarget.id).length
    : 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Header
          title="Team Tracking Dashboard"
          description="Manage your staff, track individual performance, and visualize workload."
        />
        <AddMemberForm onSubmit={handleAddMember} loading={addingMember} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          label="Total Members"
          value={team.length}
          icon={<Users className="h-6 w-6" />}
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <MetricCard
          label="Active Workload"
          value={totalTeamWorkload}
          icon={<Briefcase className="h-6 w-6" />}
          colorClass="text-blue-600 bg-blue-50"
        />
        <MetricCard
          label="Available Capacity"
          value={`${availableCapacity} free`}
          icon={<Users className="h-6 w-6" />}
          colorClass="text-indigo-600 bg-indigo-50"
        />
        <MetricCard
          label="Top Contributor"
          value={topContributor}
          icon={<Award className="h-6 w-6" />}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <MetricCard
          label="Top Performer"
          value={topPerformer}
          icon={<Award className="h-6 w-6" />}
          colorClass="text-emerald-600 bg-emerald-50"
        />
        <MetricCard
          label="Lowest Performer"
          value={lowestPerformer}
          icon={<AlertTriangle className="h-6 w-6" />}
          colorClass="text-rose-600 bg-rose-50"
        />
        <MetricCard
          label="Highest Workload"
          value={mostOverburdened}
          icon={<AlertTriangle className="h-6 w-6" />}
          colorClass="text-amber-600 bg-amber-50"
        />
        <MetricCard
          label="Most Overdue"
          value={mostOverdue}
          icon={<AlertTriangle className="h-6 w-6" />}
          colorClass="text-rose-600 bg-rose-50"
        />
      </div>

      {/* Analytics Chart */}
      <div className="mb-8">
        <PerformanceBarChart data={performanceData} />
      </div>

      {/* Team Table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Team Members</h2>
        <TeamTable performanceData={performanceData} onDeleteMember={handleRequestDelete} onEditMember={setEditTarget} />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove ${deleteTarget?.name}?`}
        description={
          orphanedTaskCount > 0
            ? `This member has ${orphanedTaskCount} task(s) that will become unassigned. This action cannot be undone.`
            : 'This action cannot be undone.'
        }
        confirmLabel="Remove Member"
        variant="danger"
        onConfirm={handleDeleteMember}
        onCancel={() => setDeleteTarget(null)}
        loading={deletingMember}
      />

      <EditMemberModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        member={editTarget ? team.find(m => m.id === editTarget.id) || null : null}
        onSubmit={handleEditMember}
        loading={updatingMember}
      />
    </>
  );
}
