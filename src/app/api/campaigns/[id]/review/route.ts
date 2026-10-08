import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { reviewCampaign } from "@/lib/db";
import { campaignReviewSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const { decision, note } = await parseJson(request, campaignReviewSchema);
  return Response.json({ campaign: reviewCampaign(id, decision, note) });
});
