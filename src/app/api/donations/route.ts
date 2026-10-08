import { formFields, formFile, handleApi, parseForm } from "@/lib/api";
import { requireApiUser } from "@/lib/auth";
import { createClaim } from "@/lib/db";
import { badRequest } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { saveUpload } from "@/lib/storage";
import { claimSchema } from "@/lib/validation";

export const POST = handleApi(async (request) => {
  const user = await requireApiUser("donor");
  rateLimit(`claim:${user.id}`, 10, 60 * 60_000);
  const form = await parseForm(request);
  const input = claimSchema.parse(formFields(form));
  const evidence = formFile(form, "evidence");
  if (!evidence) throw badRequest("Attach a payment screenshot or receipt.");
  const file = await saveUpload(evidence, user.id);

  const claim = createClaim(
    {
      ...input,
      paidAt: new Date(input.paidAt).toISOString(),
      note: input.note || undefined,
      evidenceName: file.fileName,
      evidenceFileId: file.id,
      evidenceHash: file.sha256,
    },
    user,
  );
  return Response.json(
    {
      claimId: claim.id,
      status: claim.status,
      message:
        claim.status === "flagged"
          ? "Submitted for enhanced review because automated checks found a potential issue."
          : "Submitted privately. The fundraiser will confirm receipt before an independent review.",
    },
    { status: 201 },
  );
});
