import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CampaignManager } from "@/components/campaign-manager";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { requirePageRole } from "@/lib/auth";
import { getCampaignById, getDashboardForUser } from "@/lib/db";
import { formatBDT, percentOf } from "@/lib/format";

export const metadata: Metadata = { title: "Manage campaign", robots: { index: false } };

export default async function ManageCampaignPage({ params }: PageProps<"/dashboard/campaigns/[id]">) {
  const { id } = await params;
  const session = await requirePageRole(["fundraiser", "admin"], `/dashboard/campaigns/${id}`);
  if (session.role === "admin") redirect("/dashboard#campaigns");
  const campaign = getCampaignById(id);
  if (!campaign || campaign.fundraiserId !== session.userId) notFound();
  const disbursements = getDashboardForUser(session.userId, "fundraiser").disbursements.filter((entry) => entry.campaignId === id);

  return (
    <section className="py-10 sm:py-14">
      <div className="shell">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline"><ArrowLeft size={14} /> Back to dashboard</Link>
        <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl"><StatusBadge status={campaign.status} /><h1 className="mt-3 font-display text-3xl font-bold tracking-[-.03em] text-forest sm:text-4xl">{campaign.title}</h1>{campaign.reviewNote && campaign.status !== "changes_requested" && <p className="mt-3 text-xs text-ink/50">Latest reviewer note: {campaign.reviewNote}</p>}</div>
          <Link href={`/campaigns/${campaign.slug}`} className="btn-secondary !min-h-10 text-xs">View public page <ExternalLink size={13} /></Link>
        </div>
        <div className="surface mt-6 grid gap-5 bg-white p-5 sm:grid-cols-3">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Verified gifts</p><p className="mt-1 font-display text-2xl font-bold text-forest">{formatBDT(campaign.verifiedAmount)}</p><ProgressBar value={percentOf(campaign.verifiedAmount, campaign.goalAmount)} className="mt-2" /><p className="mt-1 text-[11px] text-ink/45">of {formatBDT(campaign.goalAmount)} · {campaign.donorCount} gifts</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Verified delivered</p><p className="mt-1 font-display text-2xl font-bold text-forest">{formatBDT(campaign.verifiedDisbursedAmount)}</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-ink/35">Public updates</p><p className="mt-1 font-display text-2xl font-bold text-forest">{campaign.updates.length}</p></div>
        </div>
        <div className="mt-6"><CampaignManager campaign={campaign} disbursements={disbursements} /></div>
      </div>
    </section>
  );
}
