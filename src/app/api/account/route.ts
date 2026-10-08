import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { toProfile, updateDisplayName } from "@/lib/db";
import { profileSchema } from "@/lib/validation";

export const PATCH = handleApi(async (request) => {
  const session = await requireApiRole();
  const { displayName } = await parseJson(request, profileSchema);
  return Response.json({ user: toProfile(updateDisplayName(session.userId, displayName)) });
});
