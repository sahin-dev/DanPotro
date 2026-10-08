import { handleApi, parseJson } from "@/lib/api";
import { getSession, requireApiRole } from "@/lib/auth";
import {
  canManageCampaign,
  editCampaign,
  getCampaignById,
  getCampaignBySlug,
  getPublicDisbursements,
  getPublicDonations,
  isPublicCampaign,
  toPublicCampaign,
} from "@/lib/db";
import { notFound } from "@/lib/errors";
import { campaignSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export const GET = handleApi<Context>(async (_request, { params }) => {
  const { id } = await params;
  const campaign = getCampaignById(id) ?? getCampaignBySlug(id);
  const session = await getSession();
  const canManage = campaign ? canManageCampaign(campaign, session) : false;
  if (!campaign || (!isPublicCampaign(campaign) && !canManage)) throw notFound("Campaign not found.");
  return Response.json({
    campaign: canManage ? campaign : toPublicCampaign(campaign),
    donations: getPublicDonations(campaign.id),
    disbursements: getPublicDisbursements(campaign.id),
  });
});

/** Fundraisers can edit a campaign while it is in review or after changes were requested. */
export const PATCH = handleApi<Context>(async (request, { params }) => {
  const session = await requireApiRole("fundraiser");
  const { id } = await params;
  const input = await parseJson(request, campaignSchema);
  return Response.json({ campaign: editCampaign(id, input, session.userId) });
});
