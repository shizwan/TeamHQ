import { NextResponse } from 'next/server';
import { requireAuth, badRequestResponse, forbiddenResponse, serverErrorResponse } from '@/lib/auth';
import { createUser, listUsers } from '@/lib/services/userService';
import { CreateUserSchema } from '@/lib/validation/schemas';
import { logActivity } from '@/lib/services/activityService';

export async function GET(request: Request) {
  const authResult = await requireAuth(request, 'user:manage');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const users = await listUsers(authResult.user.workspaceId);
    return NextResponse.json(users);
  } catch (error) {
    console.error('[LIST USERS ERROR]', error);
    return serverErrorResponse('Failed to fetch user directory');
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, 'user:manage');
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = CreateUserSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const created = await createUser(parseResult.data, authResult.user.workspaceId);

    await logActivity({
      workspaceId: authResult.user.workspaceId,
      userId: authResult.user.uid,
      actorName: authResult.user.displayName,
      actorEmail: authResult.user.email,
      action: 'created',
      entityType: 'system',
      entityTitle: 'User Created',
      details: `Created new user account "${created.name}" (${created.email}) with role ${created.role}.`,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('[CREATE USER ERROR]', error);
    return badRequestResponse(error.message || 'Failed to create user');
  }
}
