"use client";

import { CheckCircle2, CircleDollarSign, Clock3, Flag, Gauge, LayoutDashboard, RefreshCw, ShieldCheck, Truck, UserRound, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminView } from "@/components/dashboard/admin-view";
import { DonorView } from "@/components/dashboard/donor-view";
import { FundraiserView } from "@/components/dashboard/fundraiser-view";
import { Metric, Toast, type Act } from "@/components/dashboard/shared";
import { apiRequest, errorMessage } from "@/lib/client";
import { formatBDT } from "@/lib/format";
import type { DashboardSnapshot, UserRole } from "@/lib/types";

const roleMeta: Record<UserRole, { label: string; icon: React.ReactNode; title: string; text: string }> = {
  donor: { label: "Donor", icon: <UserRound size={16} />, title: "Your giving record", text: "Track private evidence, review decisions, and account standing without exposing your identity." },
  fundraiser: { label: "Fundraiser", icon: <UsersRound size={16} />, title: "Fundraiser workspace", text: "Manage your causes and reconcile incoming claims. Raw donor evidence remains restricted to reviewers." },
  admin: { label: "Reviewer", icon: <ShieldCheck size={16} />, title: "Trust review center", text: "Review evidence, campaigns, deliveries, safety reports, appeals, and audit events across the platform." },
};

export function DashboardClient({ initialData, currentRole, displayName }: { initialData: DashboardSnapshot; currentRole: UserRole; displayName: string }) {
  const [data, setData] = useState(initialData);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.type === "success" ? 3_500 : 7_000);
    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setData(await apiRequest<DashboardSnapshot>("/api/dashboard", { method: "GET" }));
      router.refresh(); // keeps the header's unread count in step
    } catch (caught) {
      setToast({ type: "error", message: errorMessage(caught, "Could not refresh the dashboard.") });
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  const act: Act = useCallback(async (url, body, successMessage) => {
    try {
      await apiRequest(url, { json: body });
      setToast({ type: "success", message: successMessage });
      await refresh();
      return true;
    } catch (caught) {
      setToast({ type: "error", message: errorMessage(caught) });
      return false;
    }
  }, [refresh]);

  const meta = roleMeta[currentRole];
  const count = (predicate: (status: string) => boolean) => data.claims.filter((claim) => predicate(claim.status)).length;
  const verifiedTotal = data.campaigns.reduce((sum, campaign) => sum + campaign.verifiedAmount, 0);
  const safetyCount = data.reports.filter((report) => ["open", "reviewing"].includes(report.status)).length + data.appeals.filter((appeal) => appeal.status === "pending").length;
  const points = data.users[0]?.demeritPoints ?? 0;

  return (
    <section className="py-10 sm:py-14">
      <div className="shell">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-forest"><LayoutDashboard size={15} /> Protected workspace</div><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] text-forest sm:text-5xl">{meta.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/52">{meta.text}</p></div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} disabled={refreshing} className="grid size-11 place-items-center rounded-full border border-ink/8 bg-white text-forest shadow-sm hover:border-forest/30" aria-label="Refresh dashboard"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /></button>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-ink/8 bg-white px-3 py-2.5 shadow-sm"><span className="grid size-9 place-items-center rounded-full bg-forest text-white">{meta.icon}</span><span><span className="block text-xs font-bold text-ink">{displayName}</span><span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-coral">{meta.label} · server verified</span></span></div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {currentRole === "admin" && <><Metric icon={<Clock3 />} label="Evidence waiting" value={String(count((status) => ["pending_admin", "flagged", "more_info_requested"].includes(status)))} /><Metric icon={<Flag />} label="Campaigns to review" value={String(data.campaigns.filter((campaign) => ["under_review", "changes_requested"].includes(campaign.status)).length)} /><Metric icon={<ShieldCheck />} label="Safety cases" value={String(safetyCount)} tone={safetyCount ? "warning" : "default"} /><Metric icon={<Truck />} label="Deliveries to verify" value={String(data.disbursements.filter((entry) => entry.status === "pending").length)} /></>}
          {currentRole === "fundraiser" && <><Metric icon={<CircleDollarSign />} label="Verified for your causes" value={formatBDT(verifiedTotal)} /><Metric icon={<Truck />} label="Verified delivered" value={formatBDT(data.campaigns.reduce((sum, campaign) => sum + campaign.verifiedDisbursedAmount, 0))} /><Metric icon={<Clock3 />} label="Need your response" value={String(data.claims.filter((claim) => ["pending_fundraiser", "flagged"].includes(claim.status) && !claim.fundraiserResponse).length)} /><Metric icon={<Flag />} label="Disputed or flagged" value={String(count((status) => status === "flagged"))} tone="warning" /></>}
          {currentRole === "donor" && <><Metric icon={<CircleDollarSign />} label="Verified giving" value={formatBDT(data.claims.filter((claim) => claim.status === "approved").reduce((sum, claim) => sum + claim.amount, 0))} /><Metric icon={<CheckCircle2 />} label="Verified gifts" value={String(count((status) => status === "approved"))} /><Metric icon={<Clock3 />} label="Still in review" value={String(count((status) => ["pending_fundraiser", "pending_admin", "flagged", "more_info_requested"].includes(status)))} tone={count((status) => status === "more_info_requested") ? "warning" : "default"} /><Metric icon={<Gauge />} label="Demerit points" value={`${points} / 10`} tone={points >= 7 ? "warning" : "default"} /></>}
        </div>

        <div className="mt-8">
          {currentRole === "admin" && <AdminView data={data} act={act} />}
          {currentRole === "fundraiser" && <FundraiserView data={data} act={act} />}
          {currentRole === "donor" && <DonorView data={data} act={act} />}
        </div>
      </div>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}
