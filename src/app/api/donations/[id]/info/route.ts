import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { respondToInfoRequest } from "@/lib/db";
import { infoResponseSchema } from "@/lib/validation";

/** Donor answers a reviewer's request for more information. */
export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const session = await requireApiRole("donor");
  const { id } = await params;
  const { response } = await parseJson(request, infoResponseSchema);
  const claim = respondToInfoRequest(id, response, session.userId);
  return Response.json({ status: claim.status, message: "Thanks — your answer was sent to the reviewer." });
});
