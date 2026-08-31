import { NextResponse } from 'next/server';
import { requireAuth, badRequestResponse, serverErrorResponse } from '@/lib/auth';
import { getProjects, createProject } from '@/lib/services/projectService';
import { CreateProjectSchema } from '@/lib/validation/schemas';
import { validateCsrf } from '@/lib/security';

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const projects = await getProjects(authResult.user.workspaceId, status);
    return NextResponse.json(projects);
  } catch (error) {
    console.error('[GET PROJECTS ERROR]', error);
    return serverErrorResponse('Failed to fetch projects');
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request, 'project:create');
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return badRequestResponse('CSRF validation failed');
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = CreateProjectSchema.safeParse(body);

    if (!parseResult.success) {
      return badRequestResponse('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const created = await createProject(parseResult.data, {
      uid: authResult.user.uid,
      displayName: authResult.user.displayName,
      email: authResult.user.email,
      workspaceId: authResult.user.workspaceId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('[CREATE PROJECT ERROR]', error);
    return badRequestResponse(error.message || 'Failed to create project');
  }
}
