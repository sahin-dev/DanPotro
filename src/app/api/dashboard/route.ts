import { handleApi } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getDashboardForUser } from "@/lib/db";

export const GET = handleApi(async () => {
  const session = await requireApiRole();
  return Response.json(getDashboardForUser(session.userId, session.role));
});
