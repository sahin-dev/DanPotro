import { createHash, randomBytes } from "node:crypto";

import { handleApi, parseJson } from "@/lib/api";
import { getUserByEmail, storePasswordResetToken } from "@/lib/db";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mailer";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation";

const RESET_MINUTES = 30;
const GENERIC_MESSAGE = "If an account exists for that email, a reset link is on its way. It expires in 30 minutes.";

export const POST = handleApi(async (request) => {
  rateLimit(`forgot:${clientIp(request)}`, 5, 60 * 60_000);
  const { email } = await parseJson(request, forgotPasswordSchema);
  const user = getUserByEmail(email);

  // Same response either way so the endpoint cannot be used to discover accounts.
  if (user?.passwordHash) {
    const token = randomBytes(32).toString("base64url");
    storePasswordResetToken(user.id, createHash("sha256").update(token).digest("hex"), new Date(Date.now() + RESET_MINUTES * 60_000));
    await sendEmail({
      to: user.email,
      subject: "Reset your Shohay password",
      text: `Hello ${user.displayName},\n\nUse this link within ${RESET_MINUTES} minutes to choose a new password:\n${env.siteUrl}/reset-password?token=${token}\n\nIf you did not ask for this, you can ignore this email. Your password will not change.`,
    });
  }
  return Response.json({ message: GENERIC_MESSAGE });
});
