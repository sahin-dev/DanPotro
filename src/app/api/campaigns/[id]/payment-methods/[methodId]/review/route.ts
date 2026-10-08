import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { reviewPaymentMethod } from "@/lib/db";
import { verificationSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string; methodId: string }> }>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id, methodId } = await params;
  const { decision, note } = await parseJson(request, verificationSchema);
  return Response.json({ paymentMethod: reviewPaymentMethod(id, methodId, decision, note) });
});
