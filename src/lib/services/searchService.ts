import { prisma } from '@/lib/prisma';
import type { z } from 'zod';
import type { SearchQuerySchema } from '@/lib/validation/schemas';

export interface SearchResultItem {
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

export async function searchAll(
  params: z.infer<typeof SearchQuerySchema>,
  workspaceId = 'default-workspace'
): Promise<SearchResultItem[]> {
  const query = params.q.trim();
  const limit = params.limit || 20;
  const category = params.category || 'all';

  if (!query) return [];

  const results: SearchResultItem[] = [];

  // 1. Search Tasks (Deliverables)
  if (category === 'all' || category === 'tasks') {
    const tasks = await prisma.task.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: query } },
          { deliverableId: { contains: query } },
          { slipCause: { contains: query } },
        ],
      },
      include: {
        project: { select: { title: true } },
        assignee: { select: { name: true } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    for (const t of tasks) {
      results.push({
        id: `task-${t.id}`,
        category: 'tasks',
        title: t.title,
        subtitle: `${t.project?.title || 'Unknown Project'} • Assigned to ${t.assignee?.name || 'Unassigned'}`,
        tag: t.deliverableId || 'DLV',
        badge: t.status,
        badgeColor: t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200',
        href: `/dashboard/tasks?highlight=${t.id}`,
        iconType: 'task',
      });
    }
  }

  // 2. Search Projects
  if (category === 'all' || category === 'projects') {
    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { leadOwner: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    for (const p of projects) {
      results.push({
        id: `proj-${p.id}`,
        category: 'projects',
        title: p.title,
        subtitle: p.description || `Project Lead: ${p.leadOwner || 'Shizwan'}`,
        badge: p.status,
        badgeColor: p.status === 'Active' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200',
        href: `/dashboard/projects`,
        iconType: 'project',
      });
    }
  }

  // 3. Search Team Members
  if (category === 'all' || category === 'team') {
    const members = await prisma.teamMember.findMany({
      where: {
        workspaceId,
        OR: [
          { name: { contains: query } },
          { role: { contains: query } },
          { department: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    for (const m of members) {
      results.push({
        id: `member-${m.id}`,
        category: 'team',
        title: m.name,
        subtitle: `${m.role}${m.department ? ` • ${m.department}` : ''}`,
        badge: m.status,
        badgeColor: m.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200',
        href: `/dashboard/team/${m.id}`,
        iconType: 'team',
      });
    }
  }

  return results;
}
