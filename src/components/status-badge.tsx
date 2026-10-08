import type { CampaignStatus, ClaimStatus, VerificationStatus } from "@/lib/types";

type Status = CampaignStatus | ClaimStatus | VerificationStatus;

const labels: Record<Status, string> = {
  draft: "Draft",
  under_review: "Under review",
  changes_requested: "Changes requested",
  active: "Accepting support",
  funded: "Fully funded",
  closed: "Closed",
  suspended: "Suspended",
  pending_fundraiser: "Awaiting fundraiser",
  pending_admin: "Admin review",
  more_info_requested: "Info requested",
  flagged: "Needs attention",
  approved: "Verified",
  rejected: "Rejected",
  reversed: "Reversed",
  pending: "Pending check",
  verified: "Verified",
};

const tones: Record<Status, string> = {
  draft: "bg-stone-100 text-stone-600",
  under_review: "bg-amber-50 text-amber-800",
  changes_requested: "bg-orange-50 text-orange-800",
  active: "bg-emerald-50 text-emerald-800",
  funded: "bg-forest text-white",
  closed: "bg-stone-100 text-stone-600",
  suspended: "bg-red-50 text-red-700",
  pending_fundraiser: "bg-blue-50 text-blue-800",
  pending_admin: "bg-violet-50 text-violet-800",
  more_info_requested: "bg-orange-50 text-orange-800",
  flagged: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
  reversed: "bg-stone-100 text-stone-700",
  pending: "bg-amber-50 text-amber-800",
  verified: "bg-emerald-50 text-emerald-800",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[status]}`}>
      {labels[status]}
    </span>
  );
}
