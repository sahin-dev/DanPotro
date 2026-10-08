import { formFields, formFiles, handleApi, parseForm } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { createCampaign, getPublicCampaigns } from "@/lib/db";
import { badRequest } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { saveUpload } from "@/lib/storage";
import { campaignSchema } from "@/lib/validation";

const MAX_DOCUMENTS = 5;

export const GET = handleApi(async () => Response.json({ campaigns: getPublicCampaigns() }));

export const POST = handleApi(async (request) => {
  const fundraiser = await requireApiUser("fundraiser");
  rateLimit(`campaign:create:${fundraiser.id}`, 5, 24 * 60 * 60_000);
  const form = await parseForm(request);
  const input = campaignSchema.parse(formFields(form));
  const documents = formFiles(form, "documents");
  if (documents.length > MAX_DOCUMENTS) throw badRequest(`Attach at most ${MAX_DOCUMENTS} supporting documents.`);
  const stored = await Promise.all(documents.map((file) => saveUpload(file, fundraiser.id)));
  const campaign = createCampaign(input, fundraiser, stored.map((file) => file.id));
  return Response.json({ campaign }, { status: 201 });
});
