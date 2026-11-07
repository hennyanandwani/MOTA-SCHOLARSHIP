import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth/current-user";

export default async function ApproverLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "APPROVER") redirect("/login");
  return <>{children}</>;
}
