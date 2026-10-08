import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { createClaimAppeal } from "@/lib/db";
import { appealSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const session = await requireApiRole("donor");
  const { id } = await params;
  const { reason } = await parseJson(request, appealSchema);
  const appeal = createClaimAppeal(id, reason, session.userId);
  return Response.json({ appeal, message: "Your appeal is waiting for an independent review." }, { status: 201 });
});
