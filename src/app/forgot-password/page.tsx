import type { Metadata } from "next";

import { AuthCard } from "@/components/auth-card";
import { ForgotPasswordForm } from "@/components/password-recovery";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard eyebrow="Account recovery" title="Forgot your password?" intro="Enter the email you registered with. We will send a single-use link that expires in 30 minutes.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
