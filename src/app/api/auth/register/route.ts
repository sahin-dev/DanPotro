import { handleApi, parseJson } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { createUser } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export const POST = handleApi(async (request) => {
  rateLimit(`register:${clientIp(request)}`, 5, 60 * 60_000);
  const input = await parseJson(request, registerSchema);
  const user = createUser({
    email: input.email,
    displayName: input.displayName,
    role: input.role,
    passwordHash: await hashPassword(input.password),
  });
  await createSession(user);
  return Response.json({ user: { userId: user.id, role: user.role, displayName: user.displayName } }, { status: 201 });
});
