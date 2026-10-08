import { handleApi } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { canAccessFile, getFileRecord } from "@/lib/db";
import { notFound } from "@/lib/errors";
import { readUpload } from "@/lib/storage";

/** Private evidence download for reviewers and the original uploader only. */
export const GET = handleApi<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const session = await requireApiRole();
  const { id } = await params;
  const record = getFileRecord(id);
  // Same 404 for missing and forbidden files so IDs cannot be probed.
  if (!record || !canAccessFile(record, session)) throw notFound("File not found.");
  const { data } = await readUpload(id);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": record.mimeType,
      "Content-Length": String(data.byteLength),
      "Content-Disposition": `inline; filename="${record.fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
});
