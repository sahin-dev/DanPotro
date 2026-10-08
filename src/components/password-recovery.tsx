"use client";

import { CheckCircle2, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PasswordField } from "@/components/password-field";
import { apiRequest, errorMessage } from "@/lib/client";
import { PASSWORD_RULES, isStrongPassword } from "@/lib/password-rules";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<{ message: string }>("/api/auth/forgot-password", { json: { email: new FormData(event.currentTarget).get("email") } });
      setMessage(result.message);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  if (message) return <div role="status" className="flex gap-2 rounded-xl bg-emerald-50 p-4 text-xs leading-5 text-emerald-800"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{message}</div>;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div><label className="label" htmlFor="email">Account email</label><input id="email" name="email" className="field" type="email" autoComplete="email" required /></div>
      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      <button className="btn-primary w-full" disabled={loading}>{loading && <LoaderCircle size={16} className="animate-spin" />}Send reset link</button>
      <p className="text-center text-xs text-ink/45">Remembered it? <Link href="/login" className="font-bold text-forest hover:underline">Back to sign in</Link></p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirm) return setError("The two passwords do not match.");
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/auth/reset-password", { json: { token, password } });
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div><label className="label" htmlFor="password">New password</label><PasswordField id="password" value={password} onChange={setPassword} autoComplete="new-password" describedBy="password-rules" /><p id="password-rules" className={`mt-1.5 text-[10px] ${password && !isStrongPassword(password) ? "text-amber-700" : "text-ink/35"}`}>{PASSWORD_RULES}</p></div>
      <div><label className="label" htmlFor="confirm">Confirm new password</label><PasswordField id="confirm" value={confirm} onChange={setConfirm} autoComplete="new-password" /></div>
      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      <button className="btn-primary w-full" disabled={loading}>{loading && <LoaderCircle size={16} className="animate-spin" />}Set new password</button>
    </form>
  );
}
