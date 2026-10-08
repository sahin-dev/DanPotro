import { handleApi, parseJson } from "@/lib/api";
import { authenticate, createSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { clearRateLimit, clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export const POST = handleApi(async (request) => {
  const { email, password } = await parseJson(request, loginSchema);
  const emailKey = `login:email:${email.toLowerCase()}`;
  rateLimit(`login:ip:${clientIp(request)}`, 30, 15 * 60_000);
  rateLimit(emailKey, 8, 15 * 60_000);

  const user = await authenticate(email, password);
  if (!user) throw new AppError(401, "The email or password is incorrect.");
  clearRateLimit(emailKey);
  await createSession(user);
  return Response.json({ user: { userId: user.id, role: user.role, displayName: user.displayName } });
});
