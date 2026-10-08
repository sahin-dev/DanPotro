import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { RegisterForm } from "@/components/register-form";
import { getSession, safeReturnTo } from "@/lib/auth";

export const metadata: Metadata = { title: "Create an account", description: "Join Shohay to record gifts privately or run a transparent, reviewed fundraising cause." };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const params = await searchParams;
  const returnTo = safeReturnTo(typeof params.next === "string" ? params.next : undefined);
  if (await getSession()) redirect(returnTo);
  return (
    <AuthCard eyebrow="Join Shohay" title="Create your account" intro="Free for donors and fundraisers. Your identity stays private; only verified amounts become public.">
      <RegisterForm returnTo={returnTo} />
    </AuthCard>
  );
}
