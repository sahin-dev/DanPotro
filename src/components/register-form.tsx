"use client";

import { ArrowRight, LoaderCircle, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { PasswordField } from "@/components/password-field";
import { apiRequest, errorMessage } from "@/lib/client";
import { PASSWORD_RULES, isStrongPassword } from "@/lib/password-rules";

const roles = [
  { value: "donor", title: "I want to give", text: "Record gifts privately and follow where money goes.", icon: <UserRound size={18} /> },
  { value: "fundraiser", title: "I am raising funds", text: "Apply to run a reviewed, transparent cause.", icon: <UsersRound size={18} /> },
] as const;

export function RegisterForm({ returnTo }: { returnTo: string }) {
  const [role, setRole] = useState<(typeof roles)[number]["value"]>("donor");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/auth/register", {
        json: { displayName: form.get("displayName"), email: form.get("email"), password, role, acceptTerms: form.get("acceptTerms") === "on" },
      });
      router.push(role === "fundraiser" && returnTo === "/dashboard" ? "/campaigns/new" : returnTo);
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught, "Could not create your account."));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset>
        <legend className="label">How will you use Shohay?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((item) => (
            <label key={item.value} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${role === item.value ? "border-forest bg-emerald-50/60" : "border-ink/10 hover:border-forest/30"}`}>
              <input type="radio" name="role" value={item.value} checked={role === item.value} onChange={() => setRole(item.value)} className="sr-only" />
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-forest shadow-sm">{item.icon}</span>
              <span><span className="block text-xs font-bold">{item.title}</span><span className="mt-0.5 block text-[10px] leading-4 text-ink/45">{item.text}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div><label className="label" htmlFor="displayName">{role === "fundraiser" ? "Your full name" : "Display name"}</label><input id="displayName" name="displayName" className="field" autoComplete="name" minLength={2} maxLength={60} required /><p className="mt-1.5 text-[10px] text-ink/35">{role === "fundraiser" ? "Shown publicly on your campaigns and checked against your identity documents." : "Never shown publicly. Your gifts appear under an anonymous alias."}</p></div>
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" className="field" type="email" autoComplete="email" required /></div>
      <div><label className="label" htmlFor="password">Password</label><PasswordField id="password" value={password} onChange={setPassword} autoComplete="new-password" describedBy="password-rules" /><p id="password-rules" className={`mt-1.5 text-[10px] ${password && !isStrongPassword(password) ? "text-amber-700" : "text-ink/35"}`}>{PASSWORD_RULES}</p></div>
      <label className="flex items-start gap-2.5 text-xs leading-5 text-ink/55"><input type="checkbox" name="acceptTerms" className="mt-1" required /> <span>I agree to the <Link href="/terms" className="font-bold text-forest hover:underline">terms of use</Link> and <Link href="/privacy" className="font-bold text-forest hover:underline">privacy policy</Link>, and understand that false evidence can restrict my account.</span></label>
      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      <button className="btn-primary w-full" disabled={loading}>{loading && <LoaderCircle size={17} className="animate-spin" />}{loading ? "Creating account…" : "Create account"}<ArrowRight size={16} /></button>
      <p className="text-center text-xs text-ink/45">Already registered? <Link href={`/login${returnTo !== "/dashboard" ? `?next=${encodeURIComponent(returnTo)}` : ""}`} className="font-bold text-forest hover:underline">Sign in</Link></p>
    </form>
  );
}
