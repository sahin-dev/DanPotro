import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { reviewClaimAppeal } from "@/lib/db";
import { appealReviewSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const { decision, note } = await parseJson(request, appealReviewSchema);
  return Response.json({ appeal: reviewClaimAppeal(id, decision, note) });
});
