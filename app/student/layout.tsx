
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { StudentSettingsProvider } from "@/components/student/settings/StudentSettingsProvider";
import { getCurrentAppUser } from "@/lib/auth/current-user";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (!user.student) {
    redirect("/login?error=profile_not_provisioned");
  }

  return (
    <StudentSettingsProvider>
      {children}
    </StudentSettingsProvider>
  );
}
