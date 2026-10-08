import { ArrowUpRight, CheckCircle2, MapPin } from "lucide-react";
import Link from "next/link";

import { CampaignVisual } from "@/components/campaign-visual";
import { ProgressBar } from "@/components/progress-bar";
import { daysRemaining, formatBDT, percentOf } from "@/lib/format";
import type { Campaign } from "@/lib/types";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const percent = percentOf(campaign.verifiedAmount, campaign.goalAmount);
  return (
    <article className="group overflow-hidden rounded-[1.35rem] border border-ink/8 bg-white shadow-[0_12px_40px_rgba(29,54,45,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(29,54,45,0.1)]">
      <Link href={`/campaigns/${campaign.slug}`} className="block overflow-hidden">
        <div className="transition duration-500 group-hover:scale-[1.02]">
          <CampaignVisual campaign={campaign} compact />
        </div>
      </Link>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-ink/50">
          <span className="flex items-center gap-1.5"><MapPin size={13} /> {campaign.location.split(",")[0]}</span>
          {campaign.beneficiaryVerified && <span className="flex items-center gap-1 font-semibold text-forest"><CheckCircle2 size={13} /> Beneficiary checked</span>}
        </div>
        <Link href={`/campaigns/${campaign.slug}`}>
          <h3 className="mt-3 min-h-14 font-display text-xl font-bold leading-7 tracking-[-0.025em] text-ink transition-colors group-hover:text-forest">
            {campaign.title}
          </h3>
        </Link>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-lg font-extrabold text-forest">{formatBDT(campaign.verifiedAmount)}</p>
            <p className="text-xs text-ink/45">verified of {formatBDT(campaign.goalAmount)}</p>
          </div>
          <span className="text-xs font-bold text-coral">{percent}%</span>
        </div>
        <ProgressBar value={percent} className="mt-3" />
        <div className="mt-4 flex items-center justify-between border-t border-ink/7 pt-4 text-xs text-ink/50">
          <span>{campaign.donorCount} verified gifts</span>
          <span className="flex items-center gap-1 font-bold text-forest">
            {campaign.status === "funded" ? "Funded" : campaign.status === "closed" ? "Closed" : daysRemaining(campaign.deadline) ? `${daysRemaining(campaign.deadline)} days left` : "Final day"} <ArrowUpRight size={13} />
          </span>
        </div>
      </div>
    </article>
  );
}
