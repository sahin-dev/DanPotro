import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { createCampaignReport } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/validation";

export const POST = handleApi(async (request) => {
  const session = await requireApiRole("donor", "fundraiser", "admin");
  rateLimit(`report:${session.userId}`, 5, 60 * 60_000);
  const input = await parseJson(request, reportSchema);
  const report = createCampaignReport(input, session.userId);
  return Response.json({ reportId: report.id, message: "Your report was sent privately to the review team." }, { status: 201 });
});
