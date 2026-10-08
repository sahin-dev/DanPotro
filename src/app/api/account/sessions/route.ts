import { handleApi } from "@/lib/api";
import { createSession, requireApiRole } from "@/lib/auth";
import { revokeSessions } from "@/lib/db";

/** Sign out every other device by bumping the session version, then re-issue this device's session. */
export const DELETE = handleApi(async () => {
  const session = await requireApiRole();
  await createSession(revokeSessions(session.userId));
  return Response.json({ message: "All other devices have been signed out." });
});
