"use client";

import { ArrowUpDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CampaignCard } from "@/components/campaign-card";
import { browseCategories, browseSorts, type BrowseState } from "@/lib/browse";
import { percentOf } from "@/lib/format";
import type { Campaign } from "@/lib/types";

const isOpen = (campaign: Campaign) => campaign.status === "active";

function sortCampaigns(campaigns: Campaign[], sort: BrowseState["sort"]) {
  const sorted = [...campaigns];
  const compare: Record<BrowseState["sort"], (a: Campaign, b: Campaign) => number> = {
    urgent: (a, b) => a.deadline.localeCompare(b.deadline),
    nearly: (a, b) => percentOf(b.verifiedAmount, b.goalAmount) - percentOf(a.verifiedAmount, a.goalAmount),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    supported: (a, b) => b.donorCount - a.donorCount,
  };
  // Open causes always come before completed ones so donors see where help is still needed.
  return sorted.sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || compare[sort](a, b));
}

export function CampaignBrowser({ campaigns, initial }: { campaigns: Campaign[]; initial: BrowseState }) {
  const [state, setState] = useState(initial);
  const update = (patch: Partial<BrowseState>) => setState((current) => ({ ...current, ...patch }));

  // Keep the URL shareable without a server round trip on every keystroke.
  useEffect(() => {
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.category !== "All") params.set("category", state.category);
    if (state.sort !== "urgent") params.set("sort", state.sort);
    if (state.completed) params.set("completed", "1");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [state]);

  const visible = useMemo(() => {
    const needle = state.q.trim().toLowerCase();
    return sortCampaigns(
      campaigns.filter((campaign) =>
        (state.completed || isOpen(campaign)) &&
        (state.category === "All" || campaign.category === state.category) &&
        (!needle || `${campaign.title} ${campaign.location} ${campaign.summary} ${campaign.fundraiserName}`.toLowerCase().includes(needle)),
      ),
      state.sort,
    );
  }, [campaigns, state]);

  return (
    <section className="py-14 sm:py-18">
      <div className="shell">
        <div className="flex flex-col gap-3 rounded-2xl border border-ink/8 bg-white/70 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" role="group" aria-label="Filter by category">
            {browseCategories.map((item) => <button key={item} aria-pressed={state.category === item} onClick={() => update({ category: item })} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${state.category === item ? "bg-forest text-white" : "text-ink/55 hover:bg-cream"}`}>{item}</button>)}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative min-w-0 sm:w-64"><span className="sr-only">Search causes</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" /><input type="search" value={state.q} onChange={(event) => update({ q: event.target.value })} className="field !rounded-full !py-2.5 !pl-9" placeholder="Search causes, places, people" /></label>
            <label className="relative flex items-center"><span className="sr-only">Sort causes</span><ArrowUpDown size={14} className="pointer-events-none absolute left-3 text-ink/40" /><select value={state.sort} onChange={(event) => update({ sort: event.target.value as BrowseState["sort"] })} className="field !w-auto !rounded-full !py-2.5 !pl-8 !pr-8 text-xs font-bold">{Object.entries(browseSorts).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink/48" aria-live="polite"><strong className="text-ink">{visible.length}</strong> {state.completed ? "" : "open "}cause{visible.length === 1 ? "" : "s"}</p>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink/55"><input type="checkbox" checked={state.completed} onChange={(event) => update({ completed: event.target.checked })} /> Include funded and closed causes</label>
        </div>
        {visible.length
          ? <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div>
          : <div className="surface mt-8 py-20 text-center"><p className="font-display text-2xl font-bold text-forest">No causes match that search.</p><button onClick={() => setState({ q: "", category: "All", sort: "urgent", completed: false })} className="mt-3 text-sm font-bold text-coral">Clear filters</button></div>}
      </div>
    </section>
  );
}
