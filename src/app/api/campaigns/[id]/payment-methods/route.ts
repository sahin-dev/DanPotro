import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { addPaymentMethod } from "@/lib/db";
import { paymentMethodSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const session = await requireApiRole("fundraiser");
  const { id } = await params;
  const input = await parseJson(request, paymentMethodSchema);
  return Response.json({ paymentMethod: addPaymentMethod(id, input, session.userId) }, { status: 201 });
});
