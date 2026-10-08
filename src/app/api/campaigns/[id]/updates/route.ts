import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { addCampaignUpdate } from "@/lib/db";
import { campaignUpdateSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const session = await requireApiRole("fundraiser");
  const { id } = await params;
  const input = await parseJson(request, campaignUpdateSchema);
  return Response.json({ update: addCampaignUpdate(id, input, session.userId) }, { status: 201 });
});
