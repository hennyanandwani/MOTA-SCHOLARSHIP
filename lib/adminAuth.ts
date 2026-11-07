import { getCurrentAppUser } from '@/lib/auth/current-user';
import { NextResponse } from 'next/server';

export async function requireAdmin(
  getUser: typeof getCurrentAppUser = getCurrentAppUser,
) {
  let user: Awaited<ReturnType<typeof getCurrentAppUser>>;
  try {
    user = await getUser();
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
        ? error.code
        : undefined;
    console.error('Admin authorization lookup failed:', { name, code });
    return {
      user: null,
      response: NextResponse.json(
        {
          error: 'Unable to verify administrator access.',
          code: 'AUTHORIZATION_UNAVAILABLE',
        },
        { status: 503 },
      ),
    };
  }

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
    };
  }
  if (user.role !== 'ADMIN') {
    return {
      user: null,
      response: NextResponse.json({ error: 'Admin access required.' }, { status: 403 }),
    };
  }
  return { user, response: null };
}
