'use client';

import React, { useMemo, useCallback, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import type { Task, TeamMember, Project, TaskStatus } from '@/types';
import { TASK_STATUSES } from '@/types';
import BoardColumn from './BoardColumn';
import BoardTaskCard from './BoardTaskCard';
import BoardFilterBar from './BoardFilterBar';

interface TaskBoardProps {
  tasks: Task[];
  projects: Project[];
  team: TeamMember[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete: (taskId: string, title: string) => void;
  onQuickAdd?: (status: TaskStatus) => void;
  onQuickComplete?: (taskId: string) => void;
}

export default function TaskBoard({
  tasks,
  projects,
  team,
  onStatusChange,
  onEdit,
  onDelete,
  onQuickAdd,
  onQuickComplete,
}: TaskBoardProps) {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  // Filter/sort state
  const [activeLabels, setActiveLabels] = useState<string[]>([]);
  const [activeMember, setActiveMember] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');

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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by labels
    if (activeLabels.length > 0) {
      filtered = filtered.filter((task) => {
        const taskLabels = task.labels || [];
        return activeLabels.some((label) => taskLabels.includes(label));
      });
    }

    // Filter by member
    if (activeMember) {
      filtered = filtered.filter((task) => task.assigneeId === activeMember);
    }

    return filtered;
  }, [tasks, activeLabels, activeMember]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      Pending: [],
      'In Progress': [],
      Completed: [],
      Overdue: [],
    };

    for (const task of filteredTasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      } else {
        grouped['Pending'].push(task);
      }
    }

    // Sort each group
    for (const status of TASK_STATUSES) {
      if (sortBy === 'name') {
        grouped[status].sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === 'newest') {
        grouped[status].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        grouped[status].sort(
          (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
      }
    }

    return grouped;
  }, [filteredTasks, sortBy]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = tasks.find((t) => t.id === active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const taskId = active.id as string;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Determine target status
      let targetStatus: TaskStatus | null = null;

      // If dropped over a column
      if (over.data.current?.type === 'column') {
        targetStatus = over.data.current.status as TaskStatus;
      }
      // If dropped over another task card
      else if (over.data.current?.type === 'task') {
        const overTask = over.data.current.task as Task;
        targetStatus = overTask.status;
      }

      // Only fire update if status actually changed
      if (targetStatus && targetStatus !== task.status) {
        onStatusChange(taskId, targetStatus);
      }
    },
    [tasks, onStatusChange]
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Intentionally empty — we handle status changes in onDragEnd
  }, []);

  return (
    <div>
      {/* Filter Bar */}
      <BoardFilterBar
        team={team}
        totalTasks={filteredTasks.length}
        activeLabels={activeLabels}
        onLabelsChange={setActiveLabels}
        activeMember={activeMember}
        onMemberChange={setActiveMember}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {TASK_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              team={team}
              projects={projects}
              teamMap={teamMap}
              projectMap={projectMap}
              onEdit={onEdit}
              onDelete={onDelete}
              onQuickAdd={onQuickAdd}
              onQuickComplete={onQuickComplete}
            />
          ))}
        </div>

        {/* Drag Overlay — the "ghost" card that follows the cursor */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeTask ? (
            <div className="rotate-[3deg] opacity-90">
              <BoardTaskCard
                task={activeTask}
                assigneeName={teamMap[activeTask.assigneeId] ?? 'Unknown'}
                projectName={projectMap[activeTask.projectId]}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
