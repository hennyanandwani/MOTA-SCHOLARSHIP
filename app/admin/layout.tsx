
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth/current-user";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/student");
  }

  return <>{children}</>;
}
