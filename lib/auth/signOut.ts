import { createClient } from '@/lib/supabase/client';

export async function signOutAndRedirect(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut({ scope: 'local' });

  if (error) {
    throw error;
  }

  window.location.assign('/');
}