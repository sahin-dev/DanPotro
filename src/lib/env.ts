import "server-only";

const isProduction = process.env.NODE_ENV === "production";

function flag(value: string | undefined, fallback: boolean) {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const env = {
  isProduction,
  /** Public origin used for absolute links in emails, sitemaps, and social previews. */
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  /** Seed demo campaigns and the three demo accounts. Off by default in production. */
  demoData: flag(process.env.SEED_DEMO_DATA, !isProduction),
  evidenceDir: process.env.EVIDENCE_DIR ?? ".data/evidence",
  maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
  bootstrapAdmin: process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD
    ? {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        displayName: process.env.ADMIN_NAME ?? "Review team",
      }
    : null,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
};

/** Read lazily so `next build` does not require runtime secrets. */
export function getSessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (isProduction) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters in production.");
  }
  return undefined;
}
