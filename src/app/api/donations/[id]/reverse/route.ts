import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { reverseClaim } from "@/lib/db";
import { reversalSchema } from "@/lib/validation";

/** Reverse an approved gift. The record stays in the audit trail; derived totals drop. */
export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const { note } = await parseJson(request, reversalSchema);
  return Response.json({ claim: reverseClaim(id, note) });
});
