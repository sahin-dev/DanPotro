import type { Metadata } from "next";
import { ClipboardCheck, FileCheck2, ShieldCheck } from "lucide-react";

import { NewCampaignForm } from "@/components/new-campaign-form";
import { requirePageRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Start a transparent cause" };

export default async function NewCampaignPage() {
  await requirePageRole(["fundraiser"], "/campaigns/new");
  return (
    <section className="py-12 sm:py-16">
      <div className="shell grid items-start gap-10 lg:grid-cols-[.7fr_1.3fr]">
        <div className="lg:sticky lg:top-28"><p className="eyebrow"><ShieldCheck size={15} /> Fundraiser onboarding</p><h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-[-.04em] text-forest sm:text-5xl">Start with the facts. Earn trust over time.</h1><p className="mt-5 text-sm leading-7 text-ink/58">New causes are private until the fundraiser, beneficiary relationship, documents, and payment destinations pass review.</p><div className="mt-8 space-y-4"><Step icon={<ClipboardCheck />} number="1" title="Describe the need" text="Give reviewers enough context to understand the goal and urgency." /><Step icon={<FileCheck2 />} number="2" title="Complete private checks" text="Identity and supporting records are reviewed, never published raw." /><Step icon={<ShieldCheck />} number="3" title="Publish with safeguards" text="Only verified payment accounts can be shown on an active cause." /></div></div>
        <NewCampaignForm />
      </div>
    </section>
  );
}

function Step({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return <div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-forest shadow-sm [&>svg]:size-18">{icon}</span><div><p className="text-xs font-bold text-coral">Step {number}</p><h2 className="mt-0.5 text-sm font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-ink/45">{text}</p></div></div>;
}
