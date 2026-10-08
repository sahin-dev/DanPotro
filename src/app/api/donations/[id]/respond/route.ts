import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { respondToClaim } from "@/lib/db";
import { respondSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const session = await requireApiRole("fundraiser");
  const { id } = await params;
  const { response, note } = await parseJson(request, respondSchema);
  const claim = respondToClaim(id, response, note, session.userId);
  return Response.json({ status: claim.status });
});
