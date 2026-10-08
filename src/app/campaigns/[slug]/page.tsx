import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  EyeOff,
  FileCheck2,
  Flag,
  MapPin,
  ReceiptText,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserRoundCheck,
} from "lucide-react";

import { CampaignVisual } from "@/components/campaign-visual";
import { DonationForm } from "@/components/donation-form";
import { ProgressBar } from "@/components/progress-bar";
import { ReportCampaign } from "@/components/report-campaign";
import { ShareCampaign } from "@/components/share-campaign";
import { StatusBadge } from "@/components/status-badge";
import { getSession } from "@/lib/auth";
import {
  canManageCampaign,
  getCampaignBySlug,
  getPublicDisbursements,
  getPublicDonations,
  isPublicCampaign,
  toPublicCampaign,
} from "@/lib/db";
import { daysRemaining, formatBDT, formatDate, percentOf } from "@/lib/format";

const PAGE_SIZE = 20;

export async function generateMetadata({ params }: PageProps<"/campaigns/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getCampaignBySlug(slug);
  if (!campaign || !isPublicCampaign(campaign)) return { title: "Cause not found", robots: { index: false } };
  const description = `${formatBDT(campaign.verifiedAmount)} verified of ${formatBDT(campaign.goalAmount)}. ${campaign.summary}`;
  return {
    title: campaign.title,
    description,
    alternates: { canonical: `/campaigns/${campaign.slug}` },
    openGraph: { title: campaign.title, description, type: "article", url: `/campaigns/${campaign.slug}` },
    twitter: { card: "summary_large_image", title: campaign.title, description },
  };
}

export default async function CampaignPage({ params, searchParams }: PageProps<"/campaigns/[slug]">) {
  const [{ slug }, query, session] = await Promise.all([params, searchParams, getSession()]);
  const record = getCampaignBySlug(slug);
  const canManage = record ? canManageCampaign(record, session) : false;
  if (!record || (!isPublicCampaign(record) && !canManage)) notFound();
  const campaign = canManage ? record : toPublicCampaign(record);
  const isPublic = isPublicCampaign(campaign);

  const allDonations = getPublicDonations(campaign.id);
  const shown = Math.min(allDonations.length, Math.max(PAGE_SIZE, Number(query.gifts) || PAGE_SIZE));
  const donations = allDonations.slice(0, shown);
  const disbursements = getPublicDisbursements(campaign.id);
  const percent = percentOf(campaign.verifiedAmount, campaign.goalAmount);
  const deliveredPercent = campaign.verifiedAmount ? Math.round((campaign.verifiedDisbursedAmount / campaign.verifiedAmount) * 100) : 0;
  const days = daysRemaining(campaign.deadline);

  return (
    <>
      {!isPublic && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="shell flex flex-col gap-2 py-3 text-xs text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2"><ShieldAlert size={15} /> <strong>Private preview.</strong> This cause is <StatusBadge status={campaign.status} /> and is only visible to you and the review team.</p>
            {campaign.reviewNote && <p className="sm:max-w-md sm:text-right">Reviewer note: {campaign.reviewNote}</p>}
          </div>
        </div>
      )}

      <section className="border-b border-ink/7 bg-[#edf3e8] py-10 sm:py-14">
        <div className="shell">
          <div className="grid overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/82 shadow-[0_24px_70px_rgba(23,67,53,.09)] lg:grid-cols-[.9fr_1.1fr]">
            <CampaignVisual campaign={campaign} />
            <div className="p-7 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink/48"><span className="rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-forest">{campaign.category}</span><span className="flex items-center gap-1"><MapPin size={13} /> {campaign.location}</span>{campaign.status !== "active" && <StatusBadge status={campaign.status} />}</div>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-[-.042em] text-forest sm:text-5xl">{campaign.title}</h1>
              <p className="mt-4 text-sm leading-6 text-ink/58 sm:text-base">{campaign.summary}</p>
              <div className="mt-8 flex items-end justify-between"><div><p className="text-3xl font-extrabold text-forest">{formatBDT(campaign.verifiedAmount)}</p><p className="mt-1 text-xs text-ink/45">verified of {formatBDT(campaign.goalAmount)}</p></div><span className="font-display text-xl font-bold text-coral">{percent}%</span></div>
              <ProgressBar value={percent} className="mt-4 !h-3" />
              <a href="#delivered" className="mt-4 flex items-center justify-between rounded-xl bg-cream/80 px-4 py-3 hover:bg-cream">
                <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-ink/35">Verified delivered onward</p><p className="mt-1 text-sm font-extrabold text-forest">{formatBDT(campaign.verifiedDisbursedAmount)}</p></div>
                <span className="text-[11px] text-ink/45">{deliveredPercent}% of collected</span>
              </a>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-ink/55"><span className="flex items-center gap-1.5"><UserRoundCheck size={15} className="text-forest" /> {campaign.donorCount} verified gifts</span><span className="flex items-center gap-1.5"><Clock3 size={15} className="text-forest" /> {campaign.status === "funded" ? "Goal reached" : campaign.status === "active" ? (days ? `${days} days remaining` : "Final day") : `Started ${formatDate(campaign.createdAt)}`}</span></div>
              {canManage && <Link href={`/dashboard/campaigns/${campaign.id}`} className="btn-secondary mt-6 !min-h-10 text-xs"><Settings2 size={14} /> Manage this campaign</Link>}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="shell grid items-start gap-10 lg:grid-cols-[1fr_390px]">
          <div className="min-w-0 space-y-8">
            <article className="surface p-6 sm:p-8"><p className="eyebrow">The story</p><h2 className="mt-3 font-display text-3xl font-bold text-forest">Why this help is needed</h2><p className="mt-5 whitespace-pre-line text-sm leading-7 text-ink/65">{campaign.story}</p><p className="mt-6 border-t border-ink/7 pt-4 text-xs text-ink/45">Organised by <strong className="text-ink/70">{campaign.fundraiserName}</strong> · for {campaign.beneficiaryName}</p></article>

            <section className="surface p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Trust checks</p><h2 className="mt-2 font-display text-3xl font-bold text-forest">What has been verified</h2></div><ShieldCheck className="text-coral" size={32} /></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <CheckItem done={campaign.beneficiaryVerified} icon={<UserRoundCheck />} title="Fundraiser identity" text={campaign.beneficiaryVerified ? `${campaign.fundraiserName} has completed identity review.` : "Identity review is in progress."} />
                <CheckItem done={campaign.beneficiaryVerified} icon={<BadgeCheck />} title="Beneficiary link" text={campaign.beneficiaryRelationship} />
                <CheckItem done={campaign.documentsVerified} icon={<FileCheck2 />} title="Supporting documents" text={campaign.documentsVerified ? "Supporting records reviewed privately." : "Review is still in progress."} />
                <CheckItem done={campaign.paymentMethods.some((method) => method.status === "verified")} icon={<ReceiptText />} title="Payment destinations" text="Only accounts checked by reviewers are listed for donors." />
              </div>
            </section>

            <section id="delivered" className="surface scroll-mt-24 p-6 sm:p-8">
              <p className="eyebrow">Follow the money</p><h2 className="mt-2 font-display text-3xl font-bold text-forest">Verified deliveries</h2><p className="mt-2 text-sm text-ink/50">Money the fundraiser has passed on to the beneficiary or service provider, checked against receipts.</p>
              <div className="mt-6 divide-y divide-ink/7">
                {disbursements.length ? disbursements.map((entry) => <div key={entry.id} className="flex items-start justify-between gap-5 py-4"><div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f1ebe0] text-forest"><Truck size={16} /></span><div><p className="text-sm font-bold text-ink">{entry.recipient}</p><p className="mt-0.5 text-xs leading-5 text-ink/50">{entry.description}</p><p className="mt-0.5 text-[11px] text-ink/38">Verified {formatDate(entry.verifiedAt)}</p></div></div><strong className="shrink-0 text-sm text-forest">{formatBDT(entry.amount)}</strong></div>) : <div className="py-10 text-center text-sm text-ink/45">No deliveries have been verified yet.</div>}
              </div>
            </section>

            <section className="surface p-6 sm:p-8">
              <p className="eyebrow">Public record</p><h2 className="mt-2 font-display text-3xl font-bold text-forest">Verified gifts</h2><p className="mt-2 text-sm text-ink/50">Donor identities and evidence stay private. Only approved amounts and masked references appear here.</p>
              <div className="mt-6 divide-y divide-ink/7">
                {donations.length ? donations.map((donation) => <div key={donation.id} className="flex items-center justify-between gap-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-forest"><CheckCircle2 size={17} /></span><div><p className="text-sm font-bold text-ink">{donation.donorAlias}</p><p className="mt-0.5 text-[11px] text-ink/42">{donation.provider} · {donation.reference} · {formatDate(donation.approvedAt)}</p></div></div><strong className="text-sm text-forest">{formatBDT(donation.amount)}</strong></div>) : <div className="py-10 text-center text-sm text-ink/45">Approved gifts will appear here.</div>}
              </div>
              {shown < allDonations.length && <div className="mt-4 text-center"><Link href={`?gifts=${shown + PAGE_SIZE}#gifts-end`} scroll={false} className="btn-secondary !min-h-10 text-xs">Show more gifts ({allDonations.length - shown} more)</Link></div>}
              <span id="gifts-end" />
            </section>

            <section id="updates" className="surface scroll-mt-24 p-6 sm:p-8">
              <p className="eyebrow">Accountability timeline</p><h2 className="mt-2 font-display text-3xl font-bold text-forest">Campaign updates</h2>
              {campaign.updates.length
                ? <div className="mt-7 space-y-0">{campaign.updates.map((update, index) => <div key={update.id} className="relative grid grid-cols-[32px_1fr] gap-3 pb-7 last:pb-0"><div className="relative"><span className={`relative z-10 grid size-8 place-items-center rounded-full text-white ${update.type === "transfer" ? "bg-coral" : "bg-forest"}`}>{update.type === "transfer" ? <Truck size={14} /> : update.type === "milestone" ? <Flag size={14} /> : <CheckCircle2 size={15} />}</span>{index < campaign.updates.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-20px)] w-px bg-ink/12" />}</div><div><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">{update.title}</h3><span className="text-[11px] text-ink/38">{formatDate(update.createdAt)}</span></div><p className="mt-1.5 text-xs leading-5 text-ink/55">{update.body}</p></div></div>)}</div>
                : <p className="mt-6 text-sm text-ink/45">The fundraiser has not posted updates yet.</p>}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <DonationForm campaign={campaign} viewerRole={session?.role ?? null} />
            <div className="mt-4 flex gap-3 rounded-2xl border border-ink/8 bg-white/60 p-4"><EyeOff size={19} className="mt-0.5 shrink-0 text-forest" /><div><p className="text-xs font-bold text-ink">Your privacy is part of the design</p><p className="mt-1 text-[11px] leading-5 text-ink/48">The public never sees your name, phone number, or screenshot. Reviewers see evidence only for fraud checks.</p></div></div>
            {isPublic && <ShareCampaign path={`/campaigns/${campaign.slug}`} title={campaign.title} />}
            {isPublic && <ReportCampaign campaignId={campaign.id} isAuthenticated={Boolean(session)} returnTo={`/campaigns/${campaign.slug}`} />}
          </aside>
        </div>
      </section>
    </>
  );
}

function CheckItem({ icon, title, text, done }: { icon: React.ReactNode; title: string; text: string; done: boolean }) {
  return <div className={`rounded-xl border p-4 ${done ? "border-ink/7 bg-cream/60" : "border-dashed border-amber-300 bg-amber-50/40"}`}><span className={`[&>svg]:size-19 ${done ? "text-forest" : "text-amber-700"}`}>{icon}</span><p className="mt-3 text-sm font-bold">{title}</p><p className="mt-1 text-[11px] leading-5 text-ink/48">{text}</p></div>;
}
