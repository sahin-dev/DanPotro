import { handleApi } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const GET = handleApi(async () => Response.json({ user: await getSession() }));
