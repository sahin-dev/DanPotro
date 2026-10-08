import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { reviewClaim } from "@/lib/db";
import { claimReviewSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const { decision, note, demerits } = await parseJson(request, claimReviewSchema);
  return Response.json({ claim: reviewClaim(id, decision, note, decision === "rejected" ? demerits : 0) });
});
