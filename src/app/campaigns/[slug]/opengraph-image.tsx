import { ImageResponse } from "next/og";

import { getCampaignBySlug, isPublicCampaign } from "@/lib/db";
import { percentOf } from "@/lib/format";

export const alt = "Verified fundraising progress on Shohay";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The bundled OG font has no taka glyph, so amounts use the "BDT" prefix here.
const amount = (value: number) => `BDT ${new Intl.NumberFormat("en-US").format(value)}`;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = getCampaignBySlug(slug);
  const visible = campaign && isPublicCampaign(campaign) ? campaign : undefined;
  const percent = visible ? percentOf(visible.verifiedAmount, visible.goalAmount) : 0;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f8f5ed", color: "#174335", fontFamily: "serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>Shohay<span style={{ color: "#ef765f" }}>.</span></div>
          <div style={{ display: "flex", fontSize: 24, padding: "10px 22px", borderRadius: 999, background: "#174335", color: "white" }}>{visible?.category ?? "Verified record"}</div>
        </div>
        <div style={{ display: "flex", fontSize: visible && visible.title.length > 60 ? 54 : 66, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 1000 }}>
          {visible?.title ?? "Every gift, accounted for."}
        </div>
        {visible ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontFamily: "sans-serif" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 48, fontWeight: 800 }}>{amount(visible.verifiedAmount)}</div>
                <div style={{ fontSize: 24, color: "#18241f99" }}>{`verified of ${amount(visible.goalAmount)} · ${visible.donorCount} approved gifts`}</div>
              </div>
              <div style={{ fontSize: 44, fontWeight: 800, color: "#ef765f" }}>{`${percent}%`}</div>
            </div>
            <div style={{ display: "flex", height: 18, borderRadius: 999, background: "#17433522" }}>
              <div style={{ width: `${percent}%`, height: 18, borderRadius: 999, background: "#ef765f" }} />
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 28, fontFamily: "sans-serif", color: "#18241f99" }}>A transparent charity record for Bangladesh.</div>
        )}
      </div>
    ),
    size,
  );
}
