import "server-only";

import { randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getUserByEmail, getUserById } from "@/lib/db";
import { env, getSessionSecret } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { DEMO_PASSWORD } from "@/lib/seed";
import type { User, UserRole } from "@/lib/types";

export interface SessionUser {
  userId: string;
  role: UserRole;
  displayName: string;
}

const SESSION_COOKIE = "shohay_session";
const SESSION_DAYS = 7;

declare global {
  var __shohaySessionSecret: string | undefined;
}

let secretKey: Uint8Array | undefined;
function secret() {
  if (!secretKey) {
    // Development fallback is process-local, so sessions end when the server restarts.
    const value = getSessionSecret() ?? (globalThis.__shohaySessionSecret ??= randomBytes(32).toString("hex"));
    secretKey = new TextEncoder().encode(value);
  }
  return secretKey;
}

// Compared against when the email is unknown so response time does not reveal which emails exist.
let dummyHash: Promise<string> | undefined;

export async function authenticate(email: string, password: string) {
  const user = getUserByEmail(email);
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  const valid = await verifyPassword(password, user?.passwordHash || (await dummyHash));
  return valid && user?.passwordHash ? user : undefined;
}

export function getDemoAccounts() {
  if (!env.demoData) return [];
  return ["usr-donor-1", "usr-fundraiser-1", "usr-admin-1"]
    .map((userId) => getUserById(userId))
    .filter((user): user is User => Boolean(user))
    .map((user) => ({ userId: user.id, role: user.role, displayName: user.displayName, email: user.email, password: DEMO_PASSWORD }));
}

export async function createSession(user: User) {
  const token = await new SignJWT({ role: user.role, sv: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
    priority: "high",
  });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const user = payload.sub ? getUserById(payload.sub) : undefined;
    // Re-check the live record so role changes, deletions, and revocations take effect immediately.
    if (!user || user.role !== payload.role || user.sessionVersion !== payload.sv) return null;
    return { userId: user.id, role: user.role, displayName: user.displayName };
  } catch {
    return null;
  }
}

export async function requirePageRole(roles: UserRole[], returnTo: string) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!roles.includes(session.role)) redirect(`/unauthorized?required=${roles.join(",")}`);
  return session;
}

/** Throws a 401/403 `AppError` that `handleApi` turns into a JSON response. */
export async function requireApiRole(...roles: UserRole[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AppError(401, "Please sign in to continue.");
  if (roles.length && !roles.includes(session.role)) {
    throw new AppError(403, "Your role does not have permission for this action.");
  }
  return session;
}

export async function requireApiUser(...roles: UserRole[]) {
  const session = await requireApiRole(...roles);
  const user = getUserById(session.userId);
  if (!user) throw new AppError(401, "Account not found.");
  return user;
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeReturnTo(value: string | undefined | null, fallback = "/dashboard") {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}
