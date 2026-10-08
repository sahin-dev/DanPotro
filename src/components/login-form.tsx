"use client";

import { ArrowRight, HeartHandshake, LoaderCircle, LockKeyhole, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PasswordField } from "@/components/password-field";
import { apiRequest, errorMessage } from "@/lib/client";
import type { UserRole } from "@/lib/types";

type DemoAccount = { email: string; displayName: string; role: UserRole; userId: string; password: string };

const roleMeta: Record<UserRole, { title: string; text: string; icon: React.ReactNode }> = {
  donor: { title: "Donor", text: "Submit evidence, follow reviews, and appeal decisions.", icon: <UserRound size={18} /> },
  fundraiser: { title: "Fundraiser", text: "Create causes and reconcile received payments.", icon: <UsersRound size={18} /> },
  admin: { title: "Reviewer", text: "Review evidence, safety reports, and appeals.", icon: <ShieldCheck size={18} /> },
};

export function LoginForm({ accounts, returnTo }: { accounts: DemoAccount[]; returnTo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/auth/login", { json: { email, password } });
      router.push(returnTo);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught, "Sign in failed."));
      setLoading(false);
    }
  }

  return (
    <section className="relative flex flex-1 items-center overflow-hidden py-12 sm:py-16">
      <div className="absolute -left-24 top-12 size-72 rounded-full bg-mint/35 blur-3xl" /><div className="absolute -right-20 bottom-0 size-80 rounded-full bg-coral/10 blur-3xl" />
      <div className="shell relative grid overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_32px_90px_rgba(23,67,53,.12)] backdrop-blur lg:grid-cols-[.95fr_1.05fr]">
        <div className="bg-forest p-8 text-white sm:p-11 lg:p-14">
          <span className="grid size-12 place-items-center rounded-full bg-white/10 text-mint"><HeartHandshake size={23} /></span>
          <p className="eyebrow mt-8 !text-mint">Role-protected workspace</p>
          <h1 className="mt-4 max-w-md font-display text-4xl font-bold leading-[1.05] tracking-[-.04em] sm:text-5xl">The right evidence, in the right hands.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/58">Public transparency does not mean public access to private data. Your role determines exactly what you can see and do.</p>
          {accounts.length > 0 && <div className="mt-9 space-y-3"><p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Demo accounts</p>{accounts.map((account) => <button type="button" key={account.userId} onClick={() => { setEmail(account.email); setPassword(account.password); }} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${email === account.email ? "border-mint/50 bg-white/10" : "border-white/10 hover:bg-white/5"}`}><span className="grid size-9 place-items-center rounded-full bg-white/10 text-mint">{roleMeta[account.role].icon}</span><span><span className="block text-xs font-bold">Continue as {roleMeta[account.role].title}</span><span className="mt-0.5 block text-[10px] text-white/45">{roleMeta[account.role].text}</span></span></button>)}</div>}
        </div>
        <div className="p-8 sm:p-11 lg:p-14">
          <div className="mx-auto max-w-md"><p className="text-xs font-bold uppercase tracking-[.14em] text-coral">Sign in</p><h2 className="mt-2 font-display text-3xl font-bold text-forest">Welcome back</h2><p className="mt-2 text-xs leading-5 text-ink/45">New to Shohay? <Link href={`/register${returnTo !== "/dashboard" ? `?next=${encodeURIComponent(returnTo)}` : ""}`} className="font-bold text-forest hover:underline">Create a free account</Link>.</p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <div><label className="label" htmlFor="email">Email</label><input id="email" className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
              <div><div className="flex items-center justify-between"><label className="label" htmlFor="password">Password</label><Link href="/forgot-password" className="mb-[.45rem] text-[11px] font-bold text-forest hover:underline">Forgot password?</Link></div><PasswordField id="password" value={password} onChange={setPassword} autoComplete="current-password" /></div>
              {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
              <button className="btn-primary w-full" disabled={loading}>{loading ? <LoaderCircle size={17} className="animate-spin" /> : <LockKeyhole size={16} />}{loading ? "Signing in…" : "Sign in securely"}<ArrowRight size={16} /></button>
            </form>
            {accounts.length > 0 && <div className="mt-7 rounded-xl bg-cream p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-forest">Demo mode</p><p className="mt-1.5 text-xs text-ink/55">Choose a demo account on the left to fill in its credentials. Demo data is disabled in production unless <code className="rounded bg-white px-1 font-bold">SEED_DEMO_DATA=true</code>.</p></div>}
          </div>
        </div>
      </div>
    </section>
  );
}
