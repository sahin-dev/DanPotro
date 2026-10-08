"use client";

import { Bell, HeartHandshake, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import type { UserRole } from "@/lib/types";

const links = [
  { href: "/campaigns", label: "Browse causes" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/transparency", label: "Transparency" },
];

type HeaderUser = { displayName: string; role: UserRole; unread: number } | null;

const roleLabels: Record<UserRole, string> = {
  donor: "Donor",
  fundraiser: "Fundraiser",
  admin: "Reviewer",
};

export function SiteHeader({ user }: { user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 print:hidden z-50 border-b border-ink/8 bg-cream/90 backdrop-blur-xl">
      <div className="shell flex h-[72px] items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Shohay home">
          <span className="grid size-9 place-items-center rounded-full bg-forest text-white shadow-sm transition-transform group-hover:-rotate-6">
            <HeartHandshake size={19} strokeWidth={2.2} />
          </span>
          <span className="font-display text-[1.65rem] font-bold leading-none tracking-[-0.04em] text-forest">
            Shohay<span className="text-coral">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition-colors hover:text-forest ${
                pathname.startsWith(link.href) ? "text-forest" : "text-ink/65"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {user ? <>
            <NotificationBell unread={user.unread} />
            <Link href="/account" className="flex items-center gap-2 rounded-full border border-ink/8 bg-white/70 py-1.5 pl-1.5 pr-3 hover:border-forest/30" title="Account settings">
              <span className="grid size-7 place-items-center rounded-full bg-forest text-white"><UserRound size={14} /></span>
              <span className="leading-tight"><span className="block max-w-28 truncate text-[11px] font-bold text-ink">{user.displayName}</span><span className="block text-[9px] font-bold uppercase tracking-wider text-coral">{roleLabels[user.role]}</span></span>
            </Link>
            <Link href="/dashboard" className="btn-secondary h-10 px-4 text-sm"><ShieldCheck size={16} /> Dashboard</Link>
            {user.role === "fundraiser" && <Link href="/campaigns/new" className="btn-primary h-10 px-4 text-sm">Start a cause</Link>}
            <button onClick={logout} className="grid size-10 place-items-center rounded-full text-ink/40 hover:bg-white hover:text-red-700" aria-label="Sign out"><LogOut size={16} /></button>
          </> : <>
            <Link href="/login" className="btn-secondary h-10 px-4 text-sm">Sign in</Link>
            <Link href="/register" className="btn-primary h-10 px-4 text-sm">Create account</Link>
          </>}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
        {user && <NotificationBell unread={user.unread} />}
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border border-ink/10 text-ink"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink/8 bg-cream px-5 py-5 lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 font-semibold text-ink/70 hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
            {user ? <div className="mt-3 rounded-2xl border border-ink/8 bg-white p-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-forest text-white"><UserRound size={16} /></span><div><p className="text-xs font-bold">{user.displayName}</p><p className="text-[10px] font-bold uppercase tracking-wider text-coral">{roleLabels[user.role]}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><Link href="/dashboard" onClick={() => setOpen(false)} className="btn-primary">Dashboard</Link><Link href="/account" onClick={() => setOpen(false)} className="btn-secondary">Account</Link><button onClick={logout} className="btn-secondary col-span-2"><LogOut size={14} /> Sign out</button></div>{user.role === "fundraiser" && <Link href="/campaigns/new" onClick={() => setOpen(false)} className="btn-secondary mt-2 w-full">Start a cause</Link>}</div> : <div className="mt-3 grid grid-cols-2 gap-2"><Link href="/login" onClick={() => setOpen(false)} className="btn-secondary">Sign in</Link><Link href="/register" onClick={() => setOpen(false)} className="btn-primary">Create account</Link></div>}
          </div>
        </nav>
      )}
    </header>
  );
}

function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link href="/notifications" className="relative grid size-10 place-items-center rounded-full text-ink/55 hover:bg-white hover:text-forest" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
      <Bell size={18} />
      {unread > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-coral px-1 text-[9px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}
