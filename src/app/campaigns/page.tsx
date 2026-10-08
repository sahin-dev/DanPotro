import type { Metadata } from "next";

import { CampaignBrowser } from "@/components/campaign-browser";
import { browseCategories, browseSorts, type BrowseState } from "@/lib/browse";
import { getPublicCampaigns } from "@/lib/db";

export const metadata: Metadata = {
  title: "Browse verified causes",
  description: "Search reviewed charitable appeals in Bangladesh. Every total includes approved donation records only.",
  alternates: { canonical: "/campaigns" },
};

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T) =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

export default async function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  const params = await searchParams;
  const initial: BrowseState = {
    q: typeof params.q === "string" ? params.q.slice(0, 80) : "",
    category: pick(params.category, browseCategories, "All"),
    sort: pick(params.sort, Object.keys(browseSorts) as BrowseState["sort"][], "urgent"),
    completed: params.completed === "1",
  };

  return (
    <>
      <section className="border-b border-ink/7 bg-[#edf3e8] py-16 sm:py-20">
        <div className="shell text-center">
          <p className="eyebrow">Community causes</p>
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-bold tracking-[-.045em] text-forest sm:text-6xl">Give to a cause you can follow.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-ink/58">Every total shown here includes approved donation records only. Open a cause to see payment options, verification milestones, and public updates.</p>
        </div>
      </section>
      <CampaignBrowser campaigns={getPublicCampaigns()} initial={initial} />
    </>
  );
}
