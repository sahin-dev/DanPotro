import type { Metadata } from "next";
import { ArrowLeft, LockKeyhole, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Access restricted" };

export default async function UnauthorizedPage() {
  const session = await getSession();
  return <section className="flex flex-1 items-center py-20"><div className="shell"><div className="surface mx-auto max-w-xl bg-white p-8 text-center sm:p-12"><span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-50 text-amber-700"><ShieldAlert size={28} /></span><p className="eyebrow mt-6">Role-protected area</p><h1 className="mt-3 font-display text-4xl font-bold text-forest">This workspace is not available to your role.</h1><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink/52">You are signed in as <strong>{session?.role ?? "a visitor"}</strong>. Sensitive actions are checked again on the server, even if someone manually calls an API.</p><div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><Link href="/dashboard" className="btn-primary"><LockKeyhole size={15} /> Open my dashboard</Link><Link href="/" className="btn-secondary"><ArrowLeft size={15} /> Return home</Link></div></div></div></section>;
}
