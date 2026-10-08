import type { MetadataRoute } from "next";

import { getPublicCampaigns } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/campaigns", "/how-it-works", "/transparency", "/register", "/privacy", "/terms"].map((path) => ({
    url: `${env.siteUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));
  const campaigns = getPublicCampaigns().map((campaign) => ({
    url: `${env.siteUrl}/campaigns/${campaign.slug}`,
    lastModified: campaign.updates[0]?.createdAt ?? campaign.createdAt,
    changeFrequency: "daily" as const,
    priority: campaign.status === "active" ? 0.9 : 0.5,
  }));
  return [...pages, ...campaigns];
}
