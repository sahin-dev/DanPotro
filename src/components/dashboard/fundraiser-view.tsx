"use client";

import { ArrowRight, CheckCircle2, Plus, Settings2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, SectionTitle, type Act } from "@/components/dashboard/shared";
import { formatBDT, formatDate, percentOf } from "@/lib/format";
import type { Campaign, DashboardSnapshot, DonationClaim } from "@/lib/types";

export function FundraiserView({ data, act }: { data: DashboardSnapshot; act: Act }) {
  const queue = data.claims.filter((claim) => ["pending_fundraiser", "flagged"].includes(claim.status) && !claim.fundraiserResponse);
  const campaignTitle = (id: string) => data.campaigns.find((campaign) => campaign.id === id)?.title ?? "Your campaign";

  return (
    <div className="space-y-10">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3"><SectionTitle title="Your campaigns" subtitle="Status, verified totals, and what each campaign needs next." count={data.campaigns.length} /><Link href="/campaigns/new" className="btn-primary !min-h-10 text-xs"><Plus size={14} /> Start a new cause</Link></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{data.campaigns.length ? data.campaigns.map((campaign) => <CampaignSummary key={campaign.id} campaign={campaign} pendingDeliveries={data.disbursements.filter((entry) => entry.campaignId === campaign.id && entry.status === "pending").length} />) : <EmptyState message="You have not started a cause yet."><Link href="/campaigns/new" className="btn-primary mt-4 !min-h-10 text-xs">Start your first cause <ArrowRight size={14} /></Link></EmptyState>}</div>
      </div>
      <div>
        <SectionTitle title="Payments to confirm" subtitle="Compare each claim with your bKash, Nagad, Rocket, or bank statement. Donor identity and screenshots stay private." count={queue.length} />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{queue.length ? queue.map((claim) => <ReconcileCard key={claim.id} claim={claim} campaignTitle={campaignTitle(claim.campaignId)} act={act} />) : <EmptyState message="No payments are waiting for you." />}</div>
      </div>
    </div>
  );
}

function nextStep(campaign: Campaign, pendingDeliveries: number) {
  if (campaign.status === "changes_requested") return "Reviewers asked for changes — open the campaign to update and resubmit.";
  if (campaign.status === "under_review" && !campaign.paymentMethods.length) return "Add a payment destination so reviewers can verify it.";
  if (campaign.status === "under_review") return "In review. We will notify you when a decision is made.";
  if (campaign.status === "rejected") return campaign.reviewNote ? `Not approved: ${campaign.reviewNote}` : "This campaign was not approved.";
  if (campaign.status === "suspended") return campaign.reviewNote ? `Suspended: ${campaign.reviewNote}` : "Suspended pending review.";
  if (pendingDeliveries) return `${pendingDeliveries} delivery record(s) waiting for verification.`;
  const undelivered = campaign.verifiedAmount - campaign.verifiedDisbursedAmount;
  if (undelivered > 0) return `${formatBDT(undelivered)} collected but not yet shown as delivered. Record a disbursement with a receipt.`;
  return "Keep supporters informed with a public update.";
}

function CampaignSummary({ campaign, pendingDeliveries }: { campaign: Campaign; pendingDeliveries: number }) {
  const percent = percentOf(campaign.verifiedAmount, campaign.goalAmount);
  const attention = ["changes_requested", "rejected", "suspended"].includes(campaign.status);
  return (
    <article className="surface bg-white p-5">
      <div className="flex items-start justify-between gap-3"><StatusBadge status={campaign.status} /><span className="text-[10px] text-ink/35">Started {formatDate(campaign.createdAt)}</span></div>
      <h3 className="mt-3 text-sm font-bold">{campaign.title}</h3>
      <div className="mt-4 flex items-end justify-between text-xs"><span><strong className="text-base text-forest">{formatBDT(campaign.verifiedAmount)}</strong> <span className="text-ink/45">of {formatBDT(campaign.goalAmount)}</span></span><span className="text-ink/45">{formatBDT(campaign.verifiedDisbursedAmount)} delivered</span></div>
      <ProgressBar value={percent} className="mt-2" />
      <p className={`mt-4 rounded-lg p-2.5 text-[11px] leading-5 ${attention ? "bg-orange-50 text-orange-900" : "bg-cream text-ink/60"}`}>{nextStep(campaign, pendingDeliveries)}</p>
      <div className="mt-4 flex gap-2"><Link href={`/dashboard/campaigns/${campaign.id}`} className="btn-primary !min-h-9 flex-1 text-xs"><Settings2 size={14} /> Manage</Link><Link href={`/campaigns/${campaign.slug}`} className="btn-secondary !min-h-9 flex-1 text-xs">View public page</Link></div>
    </article>
  );
}

function ReconcileCard({ claim, campaignTitle, act }: { claim: DonationClaim; campaignTitle: string; act: Act }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function respond(response: "confirmed" | "disputed") {
    setBusy(response);
    const fallback = response === "confirmed" ? "Payment matched in the recipient statement." : "Payment could not be matched in the recipient statement.";
    await act(`/api/donations/${claim.id}/respond`, { response, note: note.trim() || fallback }, response === "confirmed" ? "Confirmed — sent to an independent reviewer." : "Dispute recorded for the reviewer.");
    setBusy(null);
  }

  return (
    <article className="surface bg-white p-5">
      <div className="flex items-start justify-between gap-4"><div><StatusBadge status={claim.status} /><h3 className="mt-3 text-sm font-bold">{campaignTitle}</h3><p className="mt-1 text-xs text-ink/45">{claim.provider} · <span className="font-mono">{claim.transactionId}</span> · sender •••• {claim.senderLastFour}</p><p className="mt-0.5 text-[11px] text-ink/40">Paid {formatDate(claim.paidAt, { hour: "numeric", minute: "2-digit" })}</p></div><strong className="text-lg text-forest">{formatBDT(claim.amount)}</strong></div>
      {claim.riskFlags.length > 0 && <div className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">{claim.riskFlags.join(" · ")}</div>}
      <textarea value={note} onChange={(event) => setNote(event.target.value)} className="field mt-4 min-h-14 !p-2 text-[11px]" maxLength={1000} placeholder="Optional note for the reviewer (e.g. statement line, time received)" aria-label="Note for the reviewer" />
      <div className="mt-3 grid grid-cols-2 gap-2"><button disabled={busy !== null} onClick={() => respond("disputed")} className="btn-secondary !min-h-10 text-xs text-red-700"><XCircle size={14} /> Not in my statement</button><button disabled={busy !== null} onClick={() => respond("confirmed")} className="btn-primary !min-h-10 text-xs"><CheckCircle2 size={14} /> Confirm received</button></div>
    </article>
  );
}
