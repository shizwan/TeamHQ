import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  generateDeliverableId, 
  calculateDaysActive, 
  calculateDelayHours, 
  calculateOnTimeStatus, 
  calculateLifecycleStatus 
} from '@/lib/trackerEngine';
import { logActivity } from '@/lib/activityLogger';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // Auto-generate deliverable ID if not provided
    if (!body.deliverableId) {
      const count = await prisma.task.count();
      body.deliverableId = generateDeliverableId(count + 1);
    }

    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const targetDueDate = body.targetDueDate || body.dueDate ? new Date(body.targetDueDate || body.dueDate) : null;
    const completedDate = body.completedDate ? new Date(body.completedDate) : (body.status === 'Completed' ? new Date() : null);
    
    const targetTime = body.targetDueTime || '10:00 PM';
    const compTime = body.completedTime || '10:00 PM';
    const status = body.status || 'In Progress';
    const slipCause = body.slipCause || 'N/A';

    const daysActive = calculateDaysActive(startDate, completedDate);
    const delayHours = calculateDelayHours(targetDueDate, targetTime, completedDate, compTime, status);
    const onTimeStatus = calculateOnTimeStatus(status, targetDueDate, targetTime, completedDate, compTime);
    const lifecycleStatus = calculateLifecycleStatus(status, onTimeStatus, slipCause, delayHours);

    const taskData: any = {
      userId: body.userId || 'admin-user',
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
      userId: body.userId || 'admin-user',
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
