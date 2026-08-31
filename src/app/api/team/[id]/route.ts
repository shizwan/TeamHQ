import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = await prisma.teamMember.findUnique({ where: { id } });

    const member = await prisma.teamMember.update({
      where: { id },
      data: body,
    });

    logActivity({
      userId: member.userId,
      action: 'updated',
      entityType: 'team_member',
      entityId: member.id,
      entityTitle: member.name,
      details: `Updated profile and settings for ${member.name}.`,
      metadata: { role: member.role, department: member.department, status: member.status },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.teamMember.findUnique({ where: { id } });

    await prisma.teamMember.delete({
      where: { id },
    });

    if (existing) {
      logActivity({
        userId: existing.userId,
        action: 'deleted',
        entityType: 'team_member',
        entityId: existing.id,
        entityTitle: existing.name,
        details: `Removed ${existing.name} from team roster.`,
      }).catch((err) => console.error('Activity log error:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
