import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getDemoAccounts, getSession, safeReturnTo } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const returnTo = safeReturnTo(typeof params.next === "string" ? params.next : undefined);
  if (await getSession()) redirect(returnTo);
  return <LoginForm accounts={getDemoAccounts()} returnTo={returnTo} />;
}
