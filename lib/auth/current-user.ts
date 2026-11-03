
import { createClient } from "@/lib/supabase/server";
import { assertDatabaseUrlConfigured, prisma } from "@/lib/prisma";

export async function getCurrentAppUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  assertDatabaseUrlConfigured();

  return prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    include: { student: true },
  });
}
