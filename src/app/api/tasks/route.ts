import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  generateNextDeliverableId, 
  calculateDaysActive, 
  calculateDelayHours, 
  calculateOnTimeStatus, 
  calculateLifecycleStatus,
  formatTimeString
} from '@/lib/trackerEngine';
import { logActivity } from '@/lib/activityLogger';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    const title = (body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'Deliverable title is required' }, { status: 400 });
    }

    if (!body.projectId) {
      return NextResponse.json({ error: 'Project is required' }, { status: 400 });
    }

    if (!body.assigneeId) {
      return NextResponse.json({ error: 'Assignee is required' }, { status: 400 });
    }

    // Verify project and assignee exist
    const [projectExists, memberExists] = await Promise.all([
      prisma.project.findUnique({ where: { id: body.projectId } }),
      prisma.teamMember.findUnique({ where: { id: body.assigneeId } }),
    ]);

    if (!projectExists) {
      return NextResponse.json({ error: 'Selected project does not exist' }, { status: 400 });
    }

    if (!memberExists) {
      return NextResponse.json({ error: 'Selected team member does not exist' }, { status: 400 });
    }

    // Auto-generate strictly monotonic deliverable ID if not provided
    if (!body.deliverableId) {
      const existingTasks = await prisma.task.findMany({
        select: { deliverableId: true }
      });
      body.deliverableId = generateNextDeliverableId(existingTasks.map((t) => t.deliverableId));
    }

    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const rawTarget = body.targetDueDate || body.dueDate;
    const targetDueDate = rawTarget ? new Date(rawTarget) : null;
    
    const status = body.status || 'In Progress';
    const slipCause = body.slipCause || 'N/A';
    const targetTime = body.targetDueTime || '10:00 PM';

    let completedDate: Date | null = null;
    let compTime: string | null = null;

    if (status === 'Completed') {
      completedDate = body.completedDate ? new Date(body.completedDate) : new Date();
      compTime = body.completedTime || formatTimeString(completedDate);
    } else {
      completedDate = body.completedDate ? new Date(body.completedDate) : null;
      compTime = body.completedTime || '10:00 PM';
    }

    const daysActive = calculateDaysActive(startDate, completedDate);
    const delayHours = calculateDelayHours(targetDueDate, targetTime, completedDate, compTime, status);
    const onTimeStatus = calculateOnTimeStatus(status, targetDueDate, targetTime, completedDate, compTime);
    const lifecycleStatus = calculateLifecycleStatus(status, onTimeStatus, slipCause, delayHours);

    const taskData: any = {
      userId: auth.user.uid,
      deliverableId: body.deliverableId,
      projectId: body.projectId,
      assigneeId: body.assigneeId,
      title,
      status,
      slipCause,
      startDate,
      targetDueDate,
      targetDueTime: targetTime,
      completedDate,
      completedTime: compTime,
      daysActive,
      delayHours,
      onTimeStatus,
      lifecycleStatus,
      labels: typeof body.labels === 'string' ? body.labels : JSON.stringify(body.labels || []),
      checklist: typeof body.checklist === 'string' ? body.checklist : JSON.stringify(body.checklist || []),
      completedAt: status === 'Completed' ? (completedDate || new Date()) : null,
    };

    const task = await prisma.task.create({
      data: taskData,
    });

    const projectName = projectExists ? projectExists.title : 'Project';
    const memberName = memberExists ? memberExists.name : 'Team Member';

    // Log activity
    logActivity({
      userId: auth.user.uid,
      actorName: auth.user.displayName,
      actorEmail: auth.user.email,
      action: 'created',
      entityType: 'task',
      entityId: task.id,
      entityTitle: task.title,
      details: `Created deliverable [${task.deliverableId || 'DLV'}] "${task.title}" for ${projectName}.`,
      metadata: { deliverableId: task.deliverableId, status: task.status, projectName, assigneeName: memberName },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'Failed to create task', details: String(error) }, { status: 500 });
  }
}
