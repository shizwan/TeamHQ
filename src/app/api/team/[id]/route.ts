import { NextResponse } from 'next/server';
import { requireAuth, badRequestResponse, notFoundResponse, serverErrorResponse } from '@/lib/auth';
import { getTeamMemberById, updateTeamMember, deleteTeamMember } from '@/lib/services/teamService';
import { UpdateMemberSchema } from '@/lib/validation/schemas';
import { validateCsrf } from '@/lib/security';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const member = await getTeamMemberById(id, authResult.user.workspaceId);
    if (!member) return notFoundResponse('Team member not found');
    return NextResponse.json(member);
  } catch (error) {
    console.error('[GET TEAM MEMBER BY ID ERROR]', error);
    return serverErrorResponse('Failed to fetch team member');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'team:manage');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parseResult = UpdateMemberSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const updated = await updateTeamMember(id, parseResult.data, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[UPDATE TEAM MEMBER ERROR]', error);
    if (error.message === 'Team member not found') {
      return notFoundResponse('Team member not found');
    }
    return badRequestResponse(error.message || 'Failed to update team member');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, 'team:delete');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const { id } = await params;
    const result = await deleteTeamMember(id, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[DELETE TEAM MEMBER ERROR]', error);
    if (error.message === 'Team member not found') {
      return notFoundResponse('Team member not found');
    }
    return badRequestResponse(error.message || 'Failed to remove team member');
  }
}
