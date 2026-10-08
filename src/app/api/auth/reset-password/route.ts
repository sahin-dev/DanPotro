import { createHash } from "node:crypto";

import { handleApi, parseJson } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { consumePasswordResetToken, setPasswordHash } from "@/lib/db";
import { badRequest } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation";

export const POST = handleApi(async (request) => {
  rateLimit(`reset:${clientIp(request)}`, 10, 60 * 60_000);
  const { token, password } = await parseJson(request, resetPasswordSchema);
  const user = consumePasswordResetToken(createHash("sha256").update(token).digest("hex"));
  if (!user) throw badRequest("This reset link is invalid or has expired. Request a new one.");
  const updated = setPasswordHash(user.id, await hashPassword(password));
  await createSession(updated);
  return Response.json({ message: "Your password has been changed and other devices were signed out." });
});
