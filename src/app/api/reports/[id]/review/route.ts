import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { reviewCampaignReport } from "@/lib/db";
import { reportReviewSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const { status, note } = await parseJson(request, reportReviewSchema);
  return Response.json({ report: reviewCampaignReport(id, status, note) });
});
