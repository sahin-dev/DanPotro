import type { Metadata } from "next";

import { DashboardClient } from "@/components/dashboard-client";
import { requirePageRole } from "@/lib/auth";
import { getDashboardForUser } from "@/lib/db";

export const metadata: Metadata = { title: "Review dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requirePageRole(["donor", "fundraiser", "admin"], "/dashboard");
  return <DashboardClient initialData={getDashboardForUser(session.userId, session.role)} currentRole={session.role} displayName={session.displayName} />;
}
