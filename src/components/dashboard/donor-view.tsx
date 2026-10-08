"use client";

import { ArrowRight, BadgeCheck, MessageCircleQuestion, ReceiptText, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { EmptyState, SectionTitle, type Act } from "@/components/dashboard/shared";
import { formatBDT, formatDate } from "@/lib/format";
import type { ClaimAppeal, DashboardSnapshot, DonationClaim } from "@/lib/types";

const statusHelp: Partial<Record<DonationClaim["status"], string>> = {
  pending_fundraiser: "Waiting for the fundraiser to find this payment in their statement.",
  pending_admin: "Fundraiser confirmed. An independent reviewer will decide next.",
  flagged: "Our checks found something to look at closely. A reviewer will contact you if needed.",
};

export function DonorView({ data, act }: { data: DashboardSnapshot; act: Act }) {
  const donor = data.users[0];
  const points = donor?.demeritPoints ?? 0;
  const campaignFor = (id: string) => data.campaigns.find((campaign) => campaign.id === id);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <SectionTitle title="Your private submissions" subtitle="Only you and authorized reviewers can see these transaction details." count={data.claims.length} />
        {data.claims.length ? (
          <div className="surface mt-4 overflow-hidden bg-white"><ul className="divide-y divide-ink/7">
            {data.claims.map((claim) => {
              const campaign = campaignFor(claim.campaignId);
              return (
                <li key={claim.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><StatusBadge status={claim.status} /><span className="text-[11px] text-ink/35">{formatDate(claim.submittedAt)}</span></div>
                    <p className="mt-2 text-sm font-bold">{campaign ? <Link href={`/campaigns/${campaign.slug}`} className="hover:underline">{campaign.title}</Link> : "Campaign"}</p>
                    <p className="mt-1 text-xs text-ink/45">{claim.provider} · <span className="font-mono">{claim.transactionId}</span></p>
                    {statusHelp[claim.status] && <p className="mt-2 text-[11px] text-ink/50">{statusHelp[claim.status]}</p>}
                    {claim.adminNote && claim.status !== "more_info_requested" && <p className="mt-2 text-[11px] text-ink/50">Review note: {claim.adminNote}</p>}
                    {claim.status === "reversed" && claim.reversalNote && <p className="mt-2 text-[11px] text-ink/50">Reversed: {claim.reversalNote}</p>}
                    {claim.status === "more_info_requested" && <InfoRequest claim={claim} act={act} />}
                    {claim.status === "rejected" && <AppealSubmit claim={claim} existing={data.appeals.find((appeal) => appeal.claimId === claim.id)} act={act} />}
                    {claim.status === "approved" && <Link href={`/receipts/${claim.id}`} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-forest hover:underline"><ReceiptText size={13} /> View gift record</Link>}
                  </div>
                  <strong className="text-lg text-forest">{formatBDT(claim.amount)}</strong>
                </li>
              );
            })}
          </ul></div>
        ) : (
          <div className="mt-4"><EmptyState message="You have not recorded a gift yet."><p className="mx-auto mt-2 max-w-sm text-xs text-ink/45">Send money to a cause’s verified account, then record it on the cause page so it counts toward the public total.</p><Link href="/campaigns" className="btn-primary mt-4 !min-h-10 text-xs">Find a cause <ArrowRight size={14} /></Link></EmptyState></div>
        )}
      </div>
      <aside className="space-y-6">
        <div><SectionTitle title="Account standing" subtitle="Fair-use controls for evidence submission." /><div className="surface mt-4 bg-white p-6"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-forest"><BadgeCheck /></span><strong className="font-display text-3xl text-forest">{points}<span className="text-base text-ink/30">/10</span></strong></div><h3 className="mt-5 text-sm font-bold">{points >= 10 ? "Submissions are paused" : "Submission access is active"}</h3><p className="mt-2 text-xs leading-5 text-ink/48">Rejected claims can add 1–5 points based on intent and severity. At 10, new submissions pause pending appeal.</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-ink/8"><div className="h-full rounded-full bg-coral" style={{ width: `${points * 10}%` }} /></div></div></div>
        {data.reports.length > 0 && <div><SectionTitle title="Your reports" subtitle="Confidential concerns you raised." /><ul className="surface mt-4 divide-y divide-ink/7 bg-white">{data.reports.map((report) => <li key={report.id} className="p-4 text-xs"><div className="flex items-center justify-between gap-2"><span className="font-bold capitalize">{report.category.replaceAll("_", " ")}</span><span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-bold capitalize text-ink/60">{report.status}</span></div>{report.resolutionNote && <p className="mt-1.5 text-[11px] leading-5 text-ink/50">{report.resolutionNote}</p>}</li>)}</ul></div>}
      </aside>
    </div>
  );
}

function InfoRequest({ claim, act }: { claim: DonationClaim; act: Act }) {
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
      <p className="flex gap-2 text-[11px] leading-5 text-orange-900"><MessageCircleQuestion size={14} className="mt-0.5 shrink-0" /><span><strong>Reviewer asks:</strong> {claim.infoRequest}</span></p>
      <textarea value={response} onChange={(event) => setResponse(event.target.value)} className="field mt-2 min-h-16 !p-2 text-[11px]" maxLength={2000} placeholder="Your answer (at least 10 characters)" aria-label="Your answer to the reviewer" />
      <div className="mt-2 flex justify-end"><button disabled={busy || response.trim().length < 10} onClick={async () => { setBusy(true); if (await act(`/api/donations/${claim.id}/info`, { response }, "Answer sent to the reviewer.")) setResponse(""); setBusy(false); }} className="btn-primary !min-h-8 !px-3 text-[10px]"><Send size={12} /> Send answer</button></div>
    </div>
  );
}

function AppealSubmit({ claim, existing, act }: { claim: DonationClaim; existing?: ClaimAppeal; act: Act }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (existing) return <p className="mt-3 inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-800">Appeal {existing.status}{existing.resolutionNote ? ` — ${existing.resolutionNote}` : ""}</p>;
  if (!open) return <button onClick={() => setOpen(true)} className="mt-3 text-[11px] font-bold text-coral hover:underline">Appeal this decision</button>;
  return (
    <div className="mt-3 rounded-xl bg-cream p-3">
      <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="field min-h-20" maxLength={2000} placeholder="Explain what the reviewer should reconsider (at least 20 characters)" aria-label="Appeal reason" />
      <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[10px] text-ink/35">Goes to the separate appeals queue</span><button disabled={busy || reason.trim().length < 20} onClick={async () => { setBusy(true); await act(`/api/donations/${claim.id}/appeal`, { reason }, "Appeal submitted for independent review."); setBusy(false); }} className="btn-primary !min-h-8 !px-3 text-[10px]">Submit appeal</button></div>
    </div>
  );
}
