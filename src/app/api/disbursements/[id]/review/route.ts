import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { reviewDisbursement } from "@/lib/db";
import { verificationSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const { decision, note } = await parseJson(request, verificationSchema);
  return Response.json({ disbursement: reviewDisbursement(id, decision, note) });
});
