import { getCurrentAppUser } from '@/lib/auth/current-user';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const user = await getCurrentAppUser();
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
