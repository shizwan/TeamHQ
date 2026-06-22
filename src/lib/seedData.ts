import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { getTeamCollectionPath, getTasksCollectionPath, getProjectsCollectionPath } from './firestorePaths';

export const DEMO_TEAM = [
  { name: 'Alice Johnson', role: 'Frontend Developer', department: 'Engineering' },
  { name: 'Bob Smith', role: 'Backend Developer', department: 'Engineering' },
  { name: 'Charlie Davis', role: 'UI/UX Designer', department: 'Design' },
  { name: 'Diana Lee', role: 'Product Manager', department: 'Product' },
  { name: 'Ethan Park', role: 'QA Engineer', department: 'Engineering' },
];

export const DEMO_PROJECTS = [
  { title: 'Website Redesign', description: 'Overhauling the corporate landing page.', status: 'Active' as const, startDate: '2026-06-01T09:00', dueDate: '2026-07-15T17:00' },
  { title: 'Infrastructure Migration', description: 'Moving databases and scaling up services.', status: 'Active' as const, startDate: '2026-05-15T10:00', dueDate: '2026-08-30T17:00' },
  { title: 'Q3 Security Audit', description: 'Internal security and compliance review.', status: 'Completed' as const, startDate: '2026-06-05T09:00', dueDate: '2026-06-10T17:00' },
];

export const DEMO_TASKS = [
  { title: 'Revamp Homepage Navigation', projectIndex: 0, memberIndex: 0, startDate: '2026-06-02T10:00', dueDate: '2026-07-01T14:00', status: 'In Progress' as const },
  { title: 'Database Migration to Postgres', projectIndex: 1, memberIndex: 1, startDate: '2026-05-20T09:00', dueDate: '2026-06-18T10:00', status: 'Overdue' as const },
  { title: 'User Onboarding Flow UI', projectIndex: 0, memberIndex: 2, startDate: '2026-06-10T13:00', dueDate: '2026-06-20T16:30', status: 'Completed' as const },
  { title: 'Sprint Planning Dashboard', projectIndex: 0, memberIndex: 3, startDate: '2026-06-25T10:00', dueDate: '2026-07-05T09:00', status: 'Pending' as const },
  { title: 'API Rate Limiting Implementation', projectIndex: 1, memberIndex: 1, startDate: '2026-07-01T09:00', dueDate: '2026-07-10T12:00', status: 'In Progress' as const },
  { title: 'Mobile Responsive Audit', projectIndex: 0, memberIndex: 0, startDate: '2026-06-15T10:00', dueDate: '2026-06-25T11:00', status: 'Completed' as const },
  { title: 'End-to-End Test Suite', projectIndex: 2, memberIndex: 4, startDate: '2026-06-20T10:00', dueDate: '2026-07-08T15:45', status: 'Pending' as const },
  { title: 'Design System Documentation', projectIndex: 0, memberIndex: 2, startDate: '2026-06-15T09:00', dueDate: '2026-06-28T17:00', status: 'In Progress' as const },
];

export async function seedDemoData(userId: string): Promise<void> {
  const batch = writeBatch(db);
  const teamPath = getTeamCollectionPath(userId);
  const tasksPath = getTasksCollectionPath(userId);
  const projectsPath = getProjectsCollectionPath(userId);

  const now = new Date().toISOString();
  const teamDocIds: string[] = [];
  const projectDocIds: string[] = [];

  // Create team members
  for (const member of DEMO_TEAM) {
    const newDoc = doc(collection(db, teamPath));
    teamDocIds.push(newDoc.id);
    batch.set(newDoc, {
      name: member.name,
      role: member.role,
      department: member.department,
      createdAt: now,
    });
  }

  // Create projects
  for (const project of DEMO_PROJECTS) {
    const newDoc = doc(collection(db, projectsPath));
    projectDocIds.push(newDoc.id);
    batch.set(newDoc, {
      title: project.title,
      description: project.description,
      status: project.status,
      startDate: project.startDate,
      dueDate: project.dueDate,
      createdAt: now,
    });
  }

  // Create tasks with mapped assignee IDs
  for (const task of DEMO_TASKS) {
    const newDoc = doc(collection(db, tasksPath));
    batch.set(newDoc, {
      title: task.title,
      projectId: projectDocIds[task.projectIndex] || '',
      assigneeId: teamDocIds[task.memberIndex] || '',
      startDate: task.startDate,
      dueDate: task.dueDate,
      status: task.status,
      createdAt: now,
      updatedAt: now,
    });
  }

  await batch.commit();
}
