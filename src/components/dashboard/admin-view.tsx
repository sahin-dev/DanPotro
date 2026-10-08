"use client";

import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ExternalLink,
  History,
  MessageCircleQuestion,
  PlayCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { DecisionBox, EmptyState, FileLink, SectionTitle, type Act } from "@/components/dashboard/shared";
import { formatBDT, formatDate } from "@/lib/format";
import type { Campaign, DashboardSnapshot, DonationClaim } from "@/lib/types";

const tabs = ["evidence", "campaigns", "disbursements", "safety", "approved", "audit"] as const;
type Tab = (typeof tabs)[number];
const tabLabels: Record<Tab, string> = { evidence: "Evidence", campaigns: "Campaigns", disbursements: "Deliveries", safety: "Safety", approved: "Approved gifts", audit: "Audit trail" };

export function AdminView({ data, act }: { data: DashboardSnapshot; act: Act }) {
  const [tab, setTab] = useState<Tab>("evidence");
  // Notification links use #campaigns, #disbursements, and #safety.
  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.slice(1) as Tab;
      if (tabs.includes(hash)) setTab(hash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const campaignTitle = (id: string) => data.campaigns.find((campaign) => campaign.id === id)?.title ?? "Unknown cause";
  const evidence = data.claims.filter((claim) => ["pending_admin", "flagged", "more_info_requested"].includes(claim.status));
  const applications = data.campaigns.filter((campaign) => ["under_review", "changes_requested"].includes(campaign.status));
  const live = data.campaigns.filter((campaign) => ["active", "funded", "suspended"].includes(campaign.status));
  const pendingMethods = live.reduce((count, campaign) => count + campaign.paymentMethods.filter((method) => method.status === "pending").length, 0);
  const deliveries = data.disbursements.filter((entry) => entry.status === "pending");
  const reports = data.reports.filter((report) => ["open", "reviewing"].includes(report.status));
  const appeals = data.appeals.filter((appeal) => appeal.status === "pending");
  const approved = data.claims.filter((claim) => claim.status === "approved").slice(0, 20);
  const counts: Partial<Record<Tab, number>> = { evidence: evidence.length, campaigns: applications.length + pendingMethods, disbursements: deliveries.length, safety: reports.length + appeals.length };

  const choose = (next: Tab) => {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  };

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-ink/8 bg-white/70 p-1.5" role="tablist" aria-label="Review queues">
        {tabs.map((item) => (
          <button key={item} role="tab" aria-selected={tab === item} onClick={() => choose(item)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${tab === item ? "bg-forest text-white" : "text-ink/55 hover:bg-cream"}`}>
            {tabLabels[item]}{counts[item] ? <span className={`rounded-full px-1.5 text-[10px] ${tab === item ? "bg-white/20" : "bg-coral text-white"}`}>{counts[item]}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {tab === "evidence" && <div><SectionTitle title="Evidence review queue" subtitle="Final decisions require a written reason. Raw evidence stays private to reviewers." count={evidence.length} /><div className="mt-4 space-y-4">{evidence.length ? evidence.map((claim) => <AdminClaim key={claim.id} claim={claim} campaignTitle={campaignTitle(claim.campaignId)} userPoints={data.users.find((user) => user.id === claim.submitterId)?.demeritPoints ?? 0} act={act} />) : <EmptyState />}</div></div>}

        {tab === "campaigns" && <div className="space-y-10">
          <div><SectionTitle title="Campaign applications" subtitle="Check identity, beneficiary consent, documents, and payment destinations before activation." count={applications.length} /><div className="mt-4 space-y-4">{applications.length ? applications.map((campaign) => <CampaignApplication key={campaign.id} campaign={campaign} act={act} />) : <EmptyState message="No applications are waiting." />}</div></div>
          <div><SectionTitle title="Live campaigns" subtitle="Suspend on credible safety concerns, close when complete, and verify newly added accounts." count={live.length} /><div className="mt-4 grid gap-4 lg:grid-cols-2">{live.map((campaign) => <LiveCampaign key={campaign.id} campaign={campaign} act={act} />)}</div></div>
        </div>}

        {tab === "disbursements" && <div><SectionTitle title="Delivery evidence" subtitle="Verify receipts before money counts as delivered to the beneficiary." count={deliveries.length} /><div className="mt-4 grid gap-4 lg:grid-cols-2">{deliveries.length ? deliveries.map((entry) => <article key={entry.id} className="surface bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[11px] text-ink/40">{campaignTitle(entry.campaignId)}</p><h3 className="mt-1 text-sm font-bold">{entry.recipient}</h3><p className="mt-1 text-xs leading-5 text-ink/55">{entry.description}</p></div><strong className="font-display text-xl text-forest">{formatBDT(entry.amount)}</strong></div><div className="mt-3 flex items-center gap-2"><FileLink fileId={entry.evidenceFileId} name={entry.evidenceName} /><span className="text-[10px] text-ink/35">submitted {formatDate(entry.submittedAt)}</span></div><div className="mt-4 border-t border-ink/7 pt-4"><DecisionBox compact actions={[{ value: "rejected", label: "Reject", tone: "danger", icon: <XCircle size={13} /> }, { value: "verified", label: "Verify delivery", tone: "primary", icon: <CheckCircle2 size={13} /> }]} onDecide={(decision, note) => act(`/api/disbursements/${entry.id}/review`, { decision, note }, decision === "verified" ? "Delivery verified and published." : "Delivery evidence rejected.")} /></div></article>) : <EmptyState message="No delivery evidence is waiting." />}</div></div>}

        {tab === "safety" && <div className="grid gap-8 lg:grid-cols-2">
          <div><SectionTitle title="Campaign reports" subtitle="Confidential concerns from the community." count={reports.length} /><div className="mt-4 space-y-3">{reports.length ? reports.map((report) => <article key={report.id} className="surface bg-white p-4"><div className="flex items-center gap-2"><span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold uppercase text-red-700">{report.category.replaceAll("_", " ")}</span><p className="truncate text-xs font-bold">{campaignTitle(report.campaignId)}</p></div><p className="mt-2 text-[11px] leading-5 text-ink/55">{report.detail}</p><p className="mt-1 text-[10px] text-ink/35">Submitted {formatDate(report.submittedAt)}</p><div className="mt-3"><DecisionBox compact actions={[{ value: "dismissed", label: "Dismiss" }, { value: "resolved", label: "Resolve", tone: "primary" }]} onDecide={(status, note) => act(`/api/reports/${report.id}/review`, { status, note }, `Report ${status}.`)} /></div></article>) : <EmptyState message="No open reports." />}</div></div>
          <div><SectionTitle title="Appeals" subtitle="Independent second review of rejected claims." count={appeals.length} /><div className="mt-4 space-y-3">{appeals.length ? appeals.map((appeal) => { const claim = data.claims.find((entry) => entry.id === appeal.claimId); return <article key={appeal.id} className="surface bg-white p-4"><div className="flex items-center gap-2"><span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-bold uppercase text-violet-800">Appeal</span><p className="truncate text-xs font-bold">{claim ? `${formatBDT(claim.amount)} · ${campaignTitle(claim.campaignId)}` : "Donation decision"}</p></div>{claim?.adminNote && <p className="mt-2 text-[11px] text-ink/45">Original decision: {claim.adminNote}</p>}<p className="mt-2 text-[11px] leading-5 text-ink/60">“{appeal.reason}”</p><div className="mt-3"><DecisionBox compact actions={[{ value: "denied", label: "Deny" }, { value: "upheld", label: "Uphold & reopen", tone: "primary" }]} onDecide={(decision, note) => act(`/api/appeals/${appeal.id}/review`, { decision, note }, `Appeal ${decision}.`)} /></div></article>; }) : <EmptyState message="No pending appeals." />}</div></div>
        </div>}

        {tab === "approved" && <div><SectionTitle title="Recently approved gifts" subtitle="Reverse a gift if new evidence shows it was invalid. Reversals stay in the audit trail and reduce public totals." count={approved.length} /><div className="mt-4 space-y-3">{approved.length ? approved.map((claim) => <ApprovedClaim key={claim.id} claim={claim} campaignTitle={campaignTitle(claim.campaignId)} act={act} />) : <EmptyState message="No approved gifts yet." />}</div></div>}

        {tab === "audit" && <div><SectionTitle title="Audit trail" subtitle="Append-only record of decisions and submissions." /><div className="surface mt-4 bg-white p-5"><ol className="space-y-5">{data.audit.map((event) => <li key={event.id} className="flex gap-3"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-forest"><History size={13} /></span><div><p className="text-xs font-bold text-ink">{event.action.replaceAll(".", " · ").replaceAll("_", " ")}</p><p className="mt-1 text-[11px] leading-4 text-ink/50">{event.detail}</p><p className="mt-1 text-[10px] text-ink/30">{formatDate(event.createdAt, { hour: "numeric", minute: "2-digit" })} · {event.actor}</p></div></li>)}</ol></div></div>}
      </div>
    </div>
  );
}

function AdminClaim({ claim, campaignTitle, userPoints, act }: { claim: DonationClaim; campaignTitle: string; userPoints: number; act: Act }) {
  const [demerits, setDemerits] = useState(0);
  const canApprove = claim.fundraiserResponse === "confirmed";
  return (
    <article className="surface overflow-hidden bg-white">
      <div className="flex flex-col gap-4 border-b border-ink/7 p-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={claim.status} /><span className="text-[11px] text-ink/40">Risk score {claim.riskScore}/100</span></div><h3 className="mt-3 text-sm font-bold text-ink">{campaignTitle}</h3><p className="mt-1 text-xs text-ink/45">{claim.donorAlias} · submitted {formatDate(claim.submittedAt)}</p></div><strong className="font-display text-2xl text-forest">{formatBDT(claim.amount)}</strong></div>
      <div className="grid md:grid-cols-2">
        <div className="border-b border-ink/7 p-5 md:border-b-0 md:border-r"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-ink/35">Private evidence</p><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs"><div><dt className="text-ink/35">Provider</dt><dd className="mt-1 font-bold">{claim.provider}</dd></div><div><dt className="text-ink/35">Transaction ID</dt><dd className="mt-1 break-all font-mono font-bold">{claim.transactionId}</dd></div><div><dt className="text-ink/35">Sender ending</dt><dd className="mt-1 font-bold">•••• {claim.senderLastFour}</dd></div><div><dt className="text-ink/35">Payment time</dt><dd className="mt-1 font-bold">{formatDate(claim.paidAt, { hour: "numeric", minute: "2-digit" })}</dd></div></dl><div className="mt-4"><FileLink fileId={claim.evidenceFileId} name={claim.evidenceName} /></div>{claim.note && <p className="mt-3 rounded-lg bg-cream p-2.5 text-[11px] text-ink/60">Donor note: {claim.note}</p>}</div>
        <div className="p-5"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-ink/35">Checks & responses</p><div className="mt-3 space-y-2">{claim.riskFlags.length ? claim.riskFlags.map((flag) => <p key={flag} className="flex gap-2 text-[11px] leading-4 text-amber-800"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {flag}</p>) : <p className="flex gap-2 text-[11px] text-emerald-800"><CheckCircle2 size={13} /> No automated risk flags</p>}{claim.fundraiserResponse ? <p className={`flex gap-2 text-[11px] ${claim.fundraiserResponse === "confirmed" ? "text-emerald-800" : "text-red-700"}`}>{claim.fundraiserResponse === "confirmed" ? <CheckCircle2 size={13} className="shrink-0" /> : <XCircle size={13} className="shrink-0" />} Fundraiser {claim.fundraiserResponse}: {claim.fundraiserNote || "No note"}</p> : <p className="text-[11px] text-ink/45">Fundraiser has not responded yet.</p>}</div>{claim.infoRequest && <div className="mt-3 rounded-lg bg-orange-50 p-2.5 text-[11px] leading-5 text-orange-900"><p><strong>Asked:</strong> {claim.infoRequest}</p><p className="mt-1"><strong>Answer:</strong> {claim.infoResponse ?? "Waiting for the donor…"}</p></div>}<p className="mt-4 rounded-lg bg-cream p-2.5 text-[11px] text-ink/55">Submitter has <strong>{userPoints}/10</strong> demerit points.</p></div>
      </div>
      <div className="border-t border-ink/7 bg-cream/45 p-5">
        <DecisionBox
          actions={[
            { value: "more_info", label: "Ask donor", icon: <MessageCircleQuestion size={14} /> },
            { value: "rejected", label: "Reject", tone: "danger", icon: <XCircle size={14} /> },
            ...(canApprove ? [{ value: "approved", label: "Approve", tone: "primary" as const, icon: <CheckCircle2 size={14} /> }] : []),
          ]}
          onDecide={(decision, note) => act(`/api/donations/${claim.id}/review`, { decision, note, demerits: decision === "rejected" ? demerits : 0 }, decision === "approved" ? "Gift approved and added to the public total." : decision === "more_info" ? "Question sent to the donor." : "Claim rejected.")}
          placeholder="Decision note or question for the donor (required)"
        >
          <label className="flex items-center gap-2">If rejected, add <select className="rounded-lg border border-ink/10 bg-white px-2 py-1.5 font-bold" value={demerits} onChange={(event) => setDemerits(Number(event.target.value))}><option value={0}>0 points (honest mistake)</option><option value={1}>1 point (missing detail)</option><option value={2}>2 points (repeated unsupported)</option><option value={3}>3 points (reused evidence)</option><option value={5}>5 points (forgery / fraud)</option></select></label>
          {!canApprove && <p className="mt-1 text-[10px] text-ink/40">Approval needs a fundraiser confirmation.</p>}
        </DecisionBox>
      </div>
    </article>
  );
}

function PaymentMethodReview({ campaign, act }: { campaign: Campaign; act: Act }) {
  if (!campaign.paymentMethods.length) return <p className="rounded-lg bg-amber-50 p-3 text-[11px] text-amber-900">No payment destinations yet. The fundraiser must add one before activation.</p>;
  return (
    <ul className="space-y-2">
      {campaign.paymentMethods.map((method) => (
        <li key={method.id} className="rounded-xl border border-ink/8 p-3">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold">{method.provider} · {method.type}</p><p className="mt-0.5 font-mono text-sm font-bold text-forest">{method.accountNumber}</p><p className="text-[10px] text-ink/45">Holder: {method.accountName}</p></div><StatusBadge status={method.status} /></div>
          {method.status === "pending" && <div className="mt-3"><DecisionBox compact placeholder="How was this account verified?" actions={[{ value: "rejected", label: "Reject", tone: "danger" }, { value: "verified", label: "Verify account", tone: "primary" }]} onDecide={(decision, note) => act(`/api/campaigns/${campaign.id}/payment-methods/${method.id}/review`, { decision, note }, `Payment account ${decision}.`)} /></div>}
        </li>
      ))}
    </ul>
  );
}

function CampaignApplication({ campaign, act }: { campaign: Campaign; act: Act }) {
  const hasVerifiedMethod = campaign.paymentMethods.some((method) => method.status === "verified");
  return (
    <article className="surface overflow-hidden bg-white">
      <div className="flex flex-col gap-3 border-b border-ink/7 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><StatusBadge status={campaign.status} /><span className="text-[11px] text-ink/40">{campaign.category} · {campaign.location}</span></div><h3 className="mt-3 text-base font-bold text-ink">{campaign.title}</h3><p className="mt-1 text-xs text-ink/45">By {campaign.fundraiserName} · submitted {formatDate(campaign.createdAt)}</p></div>
        <div className="text-right"><p className="font-display text-2xl font-bold text-forest">{formatBDT(campaign.goalAmount)}</p><Link href={`/campaigns/${campaign.slug}`} target="_blank" className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-forest hover:underline">Preview <ExternalLink size={11} /></Link></div>
      </div>
      <div className="grid md:grid-cols-2">
        <div className="border-b border-ink/7 p-5 md:border-b-0 md:border-r"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-ink/35">Beneficiary & story</p><p className="mt-3 text-xs"><strong>{campaign.beneficiaryName}</strong> — {campaign.beneficiaryRelationship}</p><p className="mt-2 line-clamp-5 whitespace-pre-line text-[11px] leading-5 text-ink/55">{campaign.story}</p><p className="mt-4 text-[10px] font-bold uppercase tracking-[.13em] text-ink/35">Private documents</p><div className="mt-2 flex flex-wrap gap-2">{campaign.documentFileIds.length ? campaign.documentFileIds.map((fileId, index) => <FileLink key={fileId} fileId={fileId} name={`Document ${index + 1}`} />) : <span className="text-[11px] text-amber-800">No documents uploaded — request them before activating.</span>}</div></div>
        <div className="p-5"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.13em] text-ink/35">Payment destinations</p><PaymentMethodReview campaign={campaign} act={act} /></div>
      </div>
      <div className="border-t border-ink/7 bg-cream/45 p-5">
        <DecisionBox
          actions={[
            { value: "reject", label: "Reject", tone: "danger", icon: <XCircle size={14} /> },
            ...(campaign.status === "under_review" ? [{ value: "request_changes", label: "Request changes", icon: <MessageCircleQuestion size={14} /> }] : []),
            ...(hasVerifiedMethod ? [{ value: "activate", label: "Activate", tone: "primary" as const, icon: <PlayCircle size={14} /> }] : []),
          ]}
          onDecide={(decision, note) => act(`/api/campaigns/${campaign.id}/review`, { decision, note }, decision === "activate" ? "Campaign is now live." : decision === "reject" ? "Campaign rejected." : "Change request sent to the fundraiser.")}
          placeholder="Note to the fundraiser (required, shown to them)"
        >{!hasVerifiedMethod && <span className="text-[11px] text-ink/45">Verify a payment destination to enable activation.</span>}</DecisionBox>
      </div>
    </article>
  );
}

function LiveCampaign({ campaign, act }: { campaign: Campaign; act: Act }) {
  const actions = campaign.status === "suspended"
    ? [{ value: "reinstate", label: "Reinstate", tone: "primary" as const, icon: <RotateCcw size={13} /> }]
    : [{ value: "suspend", label: "Suspend", tone: "danger" as const, icon: <Ban size={13} /> }, { value: "close", label: "Close" }];
  return (
    <article className="surface bg-white p-5">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><StatusBadge status={campaign.status} /><h3 className="mt-2 truncate text-sm font-bold"><Link href={`/campaigns/${campaign.slug}`} className="hover:underline">{campaign.title}</Link></h3><p className="mt-1 text-[11px] text-ink/45">{formatBDT(campaign.verifiedAmount)} of {formatBDT(campaign.goalAmount)} · {formatBDT(campaign.verifiedDisbursedAmount)} delivered</p></div></div>
      {campaign.paymentMethods.some((method) => method.status === "pending") && <div className="mt-4"><PaymentMethodReview campaign={{ ...campaign, paymentMethods: campaign.paymentMethods.filter((method) => method.status === "pending") }} act={act} /></div>}
      <div className="mt-4 border-t border-ink/7 pt-4"><DecisionBox compact placeholder="Reason (required, shown to the fundraiser)" actions={actions} onDecide={(decision, note) => act(`/api/campaigns/${campaign.id}/review`, { decision, note }, `Campaign ${decision === "close" ? "closed" : decision === "suspend" ? "suspended" : "reinstated"}.`)} /></div>
    </article>
  );
}

function ApprovedClaim({ claim, campaignTitle, act }: { claim: DonationClaim; campaignTitle: string; act: Act }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="surface bg-white p-4">
      <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-bold">{campaignTitle}</p><p className="mt-0.5 text-[11px] text-ink/45">{claim.donorAlias} · {claim.provider} · {claim.transactionId} · approved {claim.reviewedAt ? formatDate(claim.reviewedAt) : ""}</p></div><div className="flex items-center gap-3"><strong className="text-sm text-forest">{formatBDT(claim.amount)}</strong><button onClick={() => setOpen((value) => !value)} className="text-[11px] font-bold text-red-700 hover:underline">{open ? "Cancel" : "Reverse"}</button></div></div>
      {open && <div className="mt-3"><DecisionBox compact minLength={10} placeholder="Why is this gift being reversed? (at least 10 characters)" actions={[{ value: "reverse", label: "Reverse gift", tone: "danger", icon: <RotateCcw size={13} /> }]} onDecide={(_value, note) => act(`/api/donations/${claim.id}/reverse`, { note }, "Gift reversed and removed from the public total.")} /></div>}
    </article>
  );
}
