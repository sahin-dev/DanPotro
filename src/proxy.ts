import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// Only force HTTPS sub-resources when the site is actually served over TLS.
const HTTPS_SITE = process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false;

function contentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Inline style attributes are used for progress widths; scripts remain nonce-locked.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(HTTPS_SITE ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

/** Reject cross-site writes to the API. SameSite cookies already block most CSRF; this is defence in depth. */
function isCrossSiteWrite(request: NextRequest) {
  if (!MUTATING_METHODS.has(request.method) || !request.nextUrl.pathname.startsWith("/api/")) return false;
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    try {
      return new URL(origin).host !== host;
    } catch {
      return true;
    }
  }
  return request.headers.get("sec-fetch-site") === "cross-site";
}

export function proxy(request: NextRequest) {
  if (isCrossSiteWrite(request)) {
    return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
