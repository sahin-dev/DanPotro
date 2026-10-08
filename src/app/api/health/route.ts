import { getPlatformStats } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for load balancers and uptime monitors. */
export function GET() {
  getPlatformStats();
  return Response.json({ status: "ok", time: new Date().toISOString(), uptimeSeconds: Math.round(process.uptime()) });
}
