import { handleApi } from "@/lib/api";
import { deleteSession } from "@/lib/auth";

export const POST = handleApi(async () => {
  await deleteSession();
  return Response.json({ success: true });
});
