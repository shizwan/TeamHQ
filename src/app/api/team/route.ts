import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activityLogger';
import { requireAuth, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const team = await prisma.teamMember.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(team);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth) return unauthorizedResponse();

  try {
    const body = await req.json();

    const name = (body.name || '').trim();
    const role = (body.role || '').trim();
    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const member = await prisma.teamMember.create({
      data: {
        userId: auth.user.uid,
        name,
        role,
        department: body.department || '',
        status: body.status || 'Active',
        manager: body.manager || 'Shizwan',
      },
    });

    logActivity({
      userId: auth.user.uid,
      actorName: auth.user.displayName,
      actorEmail: auth.user.email,
      action: 'created',
      entityType: 'team_member',
      entityId: member.id,
      entityTitle: member.name,
      details: `Added ${member.name} as ${member.role}${member.department ? ` (${member.department})` : ''}.`,
      metadata: { role: member.role, department: member.department },
    }).catch((err) => console.error('Activity log error:', err));

    return NextResponse.json(member);
  } catch (error) {
    console.error('Failed to create team member:', error);
    return NextResponse.json({ error: 'Failed to create member', details: String(error) }, { status: 500 });
  }
}
