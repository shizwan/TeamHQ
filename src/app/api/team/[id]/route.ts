import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { validateMemberForm } from '@/lib/validation';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.teamMember.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const name = body.name !== undefined ? (body.name || '').trim() : existing.name;
    const role = body.role !== undefined ? (body.role || '').trim() : existing.role;
    const department = body.department !== undefined ? body.department : existing.department;

    const validationError = validateMemberForm({ name, role, department });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const updateData: any = {
      name,
      role,
      department,
    };
    if (body.status !== undefined) updateData.status = body.status;
    if (body.manager !== undefined) updateData.manager = body.manager;

    const member = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    logActivity({
      userId: auth.user.uid,
      actorName: auth.user.displayName,
      actorEmail: auth.user.email,
      action: 'updated',
      entityType: 'team_member',
      entityId: member.id,
      entityTitle: member.name,
      details: `Updated profile and settings for ${member.name}.`,
      metadata: { role: member.role, department: member.department, status: member.status },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to update member:', error);
    return NextResponse.json({ error: 'Failed to update member', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const { id } = await params;
    const existing = await prisma.teamMember.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Check if member has active tasks and log count
    const taskCount = await prisma.task.count({ where: { assigneeId: id } });

    await prisma.teamMember.delete({
      where: { id },
    });

    logActivity({
      userId: auth.user.uid,
      actorName: auth.user.displayName,
      actorEmail: auth.user.email,
      action: 'deleted',
      entityType: 'team_member',
      entityId: existing.id,
      entityTitle: existing.name,
      details: `Removed ${existing.name} from team roster (${taskCount} associated task(s) removed).`,
      metadata: { role: existing.role, department: existing.department, taskCount },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json({ success: true, deletedTasksCount: taskCount });
  } catch (error) {
    console.error('Failed to delete member:', error);
    return NextResponse.json({ error: 'Failed to delete member', details: String(error) }, { status: 500 });
  }
}
