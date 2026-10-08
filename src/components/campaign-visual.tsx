import { BookOpen, HeartPulse, Home } from "lucide-react";
import type { Campaign } from "@/lib/types";

const styleMap = {
  mint: "from-[#d9f1df] via-[#edf8e8] to-[#f8decf]",
  sand: "from-[#f2dfbf] via-[#f8edda] to-[#dcebdd]",
  lilac: "from-[#e3dff4] via-[#f2effa] to-[#f4d9cd]",
};

export function CampaignVisual({ campaign, compact = false }: { campaign: Campaign; compact?: boolean }) {
  const Icon = campaign.category === "Medical" ? HeartPulse : campaign.category === "Education" ? BookOpen : Home;
  return (
    <div className={`campaign-visual relative overflow-hidden bg-gradient-to-br ${styleMap[campaign.accent]} ${compact ? "h-48" : "h-full min-h-[300px]"}`}>
      <div className="absolute -right-10 -top-12 size-44 rounded-full border-[28px] border-white/40" />
      <div className="absolute -bottom-20 -left-12 size-60 rounded-full bg-forest/10" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative grid size-28 place-items-center rounded-[2.2rem] bg-white/70 text-forest shadow-[0_24px_60px_rgba(23,67,53,0.14)] backdrop-blur-sm rotate-3">
          <Icon size={48} strokeWidth={1.5} />
          <span className="absolute -bottom-3 -right-4 rounded-full bg-coral px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
            Verified
          </span>
        </div>
      </div>
      <div className="absolute bottom-4 left-4 rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-bold text-forest backdrop-blur-sm">
        {campaign.category}
      </div>
    </div>
  );
}
