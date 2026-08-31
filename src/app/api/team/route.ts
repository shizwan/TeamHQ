import { NextResponse } from 'next/server';
import { requireAuth, badRequestResponse, serverErrorResponse } from '@/lib/auth';
import { getTeamMembers, createTeamMember } from '@/lib/services/teamService';
import { CreateMemberSchema } from '@/lib/validation/schemas';
import { validateCsrf } from '@/lib/security';

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') !== 'false';

    const members = await getTeamMembers(authResult.user.workspaceId, includeInactive);
    return NextResponse.json(members);
  } catch (error) {
    console.error('[GET TEAM ERROR]', error);
    return serverErrorResponse('Failed to fetch team members');
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, 'team:manage');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = CreateMemberSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const created = await createTeamMember(parseResult.data, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('[CREATE TEAM MEMBER ERROR]', error);
    return badRequestResponse(error.message || 'Failed to add team member');
  }
}
