import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth-card";
import { ResetPasswordForm } from "@/components/password-recovery";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  return (
    <AuthCard eyebrow="Account recovery" title="Choose a new password" intro="Changing your password signs you out on every other device.">
      {typeof token === "string" && token.length >= 20
        ? <ResetPasswordForm token={token} />
        : <p className="rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">This link is incomplete. <Link href="/forgot-password" className="font-bold underline">Request a new reset link</Link>.</p>}
    </AuthCard>
  );
}
