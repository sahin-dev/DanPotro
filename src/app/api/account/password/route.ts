import { handleApi, parseJson } from "@/lib/api";
import { createSession, requireApiUser } from "@/lib/auth";
import { setPasswordHash } from "@/lib/db";
import { badRequest } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validation";

export const POST = handleApi(async (request) => {
  const user = await requireApiUser();
  rateLimit(`password:${user.id}`, 5, 15 * 60_000);
  const { currentPassword, newPassword } = await parseJson(request, changePasswordSchema);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) throw badRequest("Your current password is incorrect.");
  if (currentPassword === newPassword) throw badRequest("Choose a password you have not used here before.");
  const updated = setPasswordHash(user.id, await hashPassword(newPassword));
  // Keep this device signed in with a session that matches the new version.
  await createSession(updated);
  return Response.json({ message: "Password changed. Other devices have been signed out." });
});
