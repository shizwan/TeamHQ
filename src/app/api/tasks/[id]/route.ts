import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  calculateDaysActive, 
  calculateDelayHours, 
  calculateOnTimeStatus, 
  calculateLifecycleStatus 
} from '@/lib/trackerEngine';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Fetch existing task to merge fields
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const status = body.status !== undefined ? body.status : existing.status;
    const slipCause = body.slipCause !== undefined ? body.slipCause : existing.slipCause;
    const startDate = body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : existing.startDate;
    const targetDueDate = body.targetDueDate !== undefined ? (body.targetDueDate ? new Date(body.targetDueDate) : null) : (body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : existing.targetDueDate);
    const targetTime = body.targetDueTime !== undefined ? body.targetDueTime : existing.targetDueTime;
    
    let completedDate = body.completedDate !== undefined ? (body.completedDate ? new Date(body.completedDate) : null) : existing.completedDate;
    if (status === 'Completed' && !completedDate) {
      completedDate = new Date();
    } else if (status !== 'Completed' && body.completedDate === undefined) {
      completedDate = null;
    }

    const compTime = body.completedTime !== undefined ? body.completedTime : existing.completedTime;

    const daysActive = calculateDaysActive(startDate, completedDate);
    const delayHours = calculateDelayHours(targetDueDate, targetTime, completedDate, compTime, status);
    const onTimeStatus = calculateOnTimeStatus(status, targetDueDate, targetTime, completedDate, compTime);
    const lifecycleStatus = calculateLifecycleStatus(status, onTimeStatus, slipCause, delayHours);

    const updateData: any = {
      ...body,
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
      completedAt: status === 'Completed' ? (completedDate || new Date()) : null,
    };

    delete updateData.dueDate;

    if (body.labels && typeof body.labels !== 'string') {
      updateData.labels = JSON.stringify(body.labels);
    }
    if (body.checklist && typeof body.checklist !== 'string') {
      updateData.checklist = JSON.stringify(body.checklist);
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error("PATCH Task Error:", error);
    return NextResponse.json({ error: 'Failed to update task', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Task Error:", error);
    return NextResponse.json({ error: 'Failed to delete task', details: String(error) }, { status: 500 });
  }
}
