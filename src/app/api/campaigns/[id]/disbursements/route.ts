import { formFields, formFile, handleApi, parseForm } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { createDisbursement } from "@/lib/db";
import { badRequest } from "@/lib/errors";
import { saveUpload } from "@/lib/storage";
import { disbursementSchema } from "@/lib/validation";

export const POST = handleApi<{ params: Promise<{ id: string }> }>(async (request, { params }) => {
  const session = await requireApiRole("fundraiser");
  const { id } = await params;
  const form = await parseForm(request);
  const input = disbursementSchema.parse(formFields(form));
  const evidence = formFile(form, "evidence");
  if (!evidence) throw badRequest("Attach a receipt, invoice, or signed acknowledgement.");
  const file = await saveUpload(evidence, session.userId);
  const disbursement = createDisbursement(id, { ...input, evidenceName: file.fileName, evidenceFileId: file.id }, session.userId);
  return Response.json({ disbursement }, { status: 201 });
});
