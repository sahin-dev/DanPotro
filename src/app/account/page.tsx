import type { Metadata } from "next";
import { BadgeCheck, Gauge, KeyRound, MonitorSmartphone, UserRound } from "lucide-react";

import { ChangePasswordForm, ProfileForm, SessionControls } from "@/components/account-settings";
import { requirePageRole } from "@/lib/auth";
import { DEMERIT_BLOCK_THRESHOLD, getUserById } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Account settings", robots: { index: false } };

const roleLabels = { donor: "Donor", fundraiser: "Fundraiser", admin: "Reviewer" } as const;

export default async function AccountPage() {
  const session = await requirePageRole(["donor", "fundraiser", "admin"], "/account");
  const user = getUserById(session.userId)!;

  return (
    <section className="py-10 sm:py-14">
      <div className="shell max-w-4xl">
        <p className="eyebrow"><UserRound size={15} /> Account</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] text-forest sm:text-5xl">Account settings</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Fact label="Email" value={user.email} />
          <Fact label="Role" value={roleLabels[user.role]} />
          <Fact label="Member since" value={formatDate(user.createdAt)} />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel icon={<UserRound />} title="Profile"><ProfileForm initialName={user.displayName} /></Panel>
          <Panel icon={<KeyRound />} title="Password"><ChangePasswordForm /></Panel>
          <Panel icon={<MonitorSmartphone />} title="Signed-in devices"><SessionControls /></Panel>
          {user.role === "donor"
            ? <Panel icon={<Gauge />} title="Submission standing"><p className="font-display text-3xl font-bold text-forest">{user.demeritPoints}<span className="text-base text-ink/30"> / {DEMERIT_BLOCK_THRESHOLD}</span></p><p className="mt-2 text-xs leading-5 text-ink/50">Demerit points are added only when a reviewer finds intentionally false or reused evidence. At {DEMERIT_BLOCK_THRESHOLD}, new submissions pause until an appeal is resolved.</p></Panel>
            : <Panel icon={<BadgeCheck />} title="Verification"><p className="text-sm font-bold">{user.verified ? "Identity verified" : "Identity check pending"}</p><p className="mt-2 text-xs leading-5 text-ink/50">{user.role === "fundraiser" ? "Your identity is confirmed during your first campaign review. Payment destinations are verified separately for each campaign." : "Reviewer accounts are provisioned by the trust team."}</p></Panel>}
        </div>
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="surface bg-white p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">{label}</p><p className="mt-1 truncate text-sm font-bold text-ink">{value}</p></div>;
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <section className="surface bg-white p-6"><div className="mb-5 flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-forest [&>svg]:size-4">{icon}</span><h2 className="font-display text-xl font-bold text-forest">{title}</h2></div>{children}</section>;
}
