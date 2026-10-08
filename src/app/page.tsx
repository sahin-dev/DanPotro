import {
  ArrowRight,
  BadgeCheck,
  Check,
  EyeOff,
  FileSearch,
  HeartHandshake,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { CampaignCard } from "@/components/campaign-card";
import { getPlatformStats, getPublicCampaigns } from "@/lib/db";
import { formatBDT, percentOf } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function Home() {
  const campaigns = getPublicCampaigns().sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || b.donorCount - a.donorCount);
  const stats = getPlatformStats();
  const featured = campaigns[0];
  const featuredPercent = featured ? percentOf(featured.verifiedAmount, featured.goalAmount) : 0;

  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/7 bg-cream">
        <div className="absolute left-[-8rem] top-20 size-72 rounded-full bg-mint/35 blur-3xl" />
        <div className="absolute right-[-5rem] top-[-4rem] size-80 rounded-full bg-coral/10 blur-3xl" />
        <div className="shell grid min-h-[650px] items-center gap-14 py-16 lg:grid-cols-[1.02fr_.98fr] lg:py-20">
          <div className="relative z-10">
            <p className="eyebrow"><ShieldCheck size={15} /> Built for accountable giving</p>
            <h1 className="mt-5 max-w-2xl font-display text-[3.35rem] font-bold leading-[.98] tracking-[-0.052em] text-forest sm:text-6xl lg:text-[4.7rem]">
              Give quietly.<br />See the <em className="font-normal text-coral">good</em> clearly.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-ink/62 sm:text-lg sm:leading-8">
              Shohay keeps donors private and every approved taka visible. Submit your payment proof securely, then follow the record from fundraiser to beneficiary.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/campaigns" className="btn-primary min-h-12 px-6">Find a cause <ArrowRight size={17} /></Link>
              <Link href="/how-it-works" className="btn-secondary min-h-12 px-6">See how verification works</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-ink/55">
              <span className="flex items-center gap-1.5"><Check size={14} className="text-forest" /> No public donor identity</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-forest" /> Human-reviewed evidence</span>
              <span className="flex items-center gap-1.5"><Check size={14} className="text-forest" /> Public audit history</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] py-8 lg:py-0">
            <div className="absolute left-0 top-3 size-40 rounded-full border-[34px] border-sand/70" />
            <div className="absolute bottom-2 right-1 size-44 rounded-full border-[38px] border-mint/65" />
            <div className="relative mx-auto w-[88%] rotate-[1.5deg] rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-[0_34px_90px_rgba(23,67,53,.16)] backdrop-blur md:p-8">
              <div className="flex items-start justify-between">
                <div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-ink/40">Live verified record</p><p className="mt-1 line-clamp-2 font-display text-2xl font-bold text-forest">{featured?.title ?? "Your cause could be here"}</p></div>
                <span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-forest"><HeartHandshake size={21} /></span>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-forest p-5 text-white"><p className="text-xs text-white/60">Verified giving</p><p className="mt-2 text-2xl font-extrabold">{formatBDT(featured?.verifiedAmount ?? 0)}</p><p className="mt-5 flex items-center gap-1.5 text-[11px] text-mint"><BadgeCheck size={14} /> {featured?.donorCount ?? 0} approved gifts</p></div>
                <div className="rounded-2xl bg-[#f1ebe0] p-5"><p className="text-xs text-ink/50">Sent onward</p><p className="mt-2 text-2xl font-extrabold text-forest">{formatBDT(featured?.verifiedDisbursedAmount ?? 0)}</p><p className="mt-5 flex items-center gap-1.5 text-[11px] text-forest"><ReceiptText size={14} /> Receipts checked</p></div>
              </div>
              <div className="mt-6"><div className="mb-2 flex justify-between text-xs font-bold text-forest"><span>Campaign progress</span><span>{featuredPercent}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-forest/10"><div className="h-full rounded-full bg-coral" style={{ width: `${featuredPercent}%` }} /></div></div>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-ink/7 bg-cream/70 p-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-forest shadow-sm"><LockKeyhole size={17} /></span><div><p className="text-xs font-bold text-ink">Donor details protected</p><p className="mt-0.5 text-[11px] text-ink/48">Only the verified amount enters this public record.</p></div></div>
            </div>
            <div className="absolute -left-1 bottom-16 -rotate-3 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl sm:-left-8"><p className="flex items-center gap-2 text-xs font-bold text-forest"><BadgeCheck size={17} className="text-coral" /> Evidence approved</p></div>
          </div>
        </div>
      </section>

      <section className="border-b border-ink/7 bg-white/60">
        <div className="shell grid divide-y divide-ink/8 py-7 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Stat value={formatBDT(stats.totalVerified)} label="verified gifts on public records" />
          <Stat value={formatBDT(stats.totalDelivered)} label="verified delivered to beneficiaries" />
          <Stat value={stats.totalGifts.toLocaleString("en-US")} label="approved community gifts" />
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="shell">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow">Verified causes</p><h2 className="mt-3 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-.04em] text-forest sm:text-5xl">Help where the record is clear.</h2></div><Link href="/campaigns" className="flex items-center gap-2 text-sm font-bold text-forest hover:text-coral">Browse all causes <ArrowRight size={16} /></Link></div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{campaigns.slice(0, 3).map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div>
        </div>
      </section>

      <section className="bg-forest py-20 text-white sm:py-24">
        <div className="shell grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
          <div><p className="eyebrow !text-mint">A record, not a promise</p><h2 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-[-.04em] sm:text-5xl">Trust is built one check at a time.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-white/62 sm:text-base">Screenshots alone are easy to manipulate. Shohay combines private evidence, recipient confirmation, duplicate detection, human review, and visible transfer milestones.</p><Link href="/transparency" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-mint hover:text-white">Explore our safeguards <ArrowRight size={16} /></Link></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TrustCard icon={<EyeOff />} number="01" title="Private by default" text="Names, phone numbers, and raw screenshots never appear in the public record." />
            <TrustCard icon={<FileSearch />} number="02" title="Evidence checked" text="Transaction references are screened for reuse and matched with recipient statements." />
            <TrustCard icon={<ShieldCheck />} number="03" title="Two human decisions" text="The fundraiser responds first. An independent admin makes the final decision." />
            <TrustCard icon={<ReceiptText />} number="04" title="Follow the money" text="Fundraisers publish verified proof when money reaches the beneficiary or provider." />
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24"><div className="shell overflow-hidden rounded-[2rem] bg-[#eedcc1] px-7 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16 lg:py-14"><div className="max-w-2xl"><p className="eyebrow">Raising money for someone?</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] text-forest">Make accountability part of your appeal.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-ink/60">Create a reviewable campaign, list verified payment methods, and give your community a shared record they can trust.</p></div><Link href="/register?next=/campaigns/new" className="btn-primary mt-7 shrink-0 px-6 lg:mt-0">Start a transparent cause <ArrowRight size={17} /></Link></div></section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="px-4 py-4 text-center"><p className="font-display text-2xl font-bold text-forest sm:text-3xl">{value}</p><p className="mt-1 text-xs text-ink/48">{label}</p></div>;
}

function TrustCard({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.055] p-5"><div className="flex items-center justify-between"><span className="text-mint [&>svg]:size-5">{icon}</span><span className="text-xs font-bold text-white/25">{number}</span></div><h3 className="mt-5 text-base font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-white/55">{text}</p></div>;
}
