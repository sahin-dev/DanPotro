import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { isStrongPassword } from "@/lib/password-rules";
import { rateLimit } from "@/lib/rate-limit";
import { claimSchema, registerSchema } from "@/lib/validation";

describe("passwords", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse 42");
    expect(hash).toMatch(/^scrypt\$16384\$/);
    expect(await verifyPassword("correct horse 42", hash)).toBe(true);
    expect(await verifyPassword("correct horse 43", hash)).toBe(false);
  });

  it("uses a unique salt per hash", async () => {
    expect(await hashPassword("same password 1")).not.toBe(await hashPassword("same password 1"));
  });

  it("rejects malformed hashes instead of throwing", async () => {
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "md5$abc")).toBe(false);
  });

  it("requires length, a letter, and a number", () => {
    expect(isStrongPassword("short1")).toBe(false);
    expect(isStrongPassword("onlyletterslong")).toBe(false);
    expect(isStrongPassword("1234567890")).toBe(false);
    expect(isStrongPassword("letters and 1 number")).toBe(true);
  });
});

describe("rateLimit", () => {
  it("allows up to the limit within a window, then throws 429", () => {
    const key = `test:${Math.random()}`;
    for (let attempt = 0; attempt < 3; attempt += 1) rateLimit(key, 3, 60_000, 1_000);
    expect(() => rateLimit(key, 3, 60_000, 1_000)).toThrow(AppError);
    try {
      rateLimit(key, 3, 60_000, 1_000);
    } catch (error) {
      expect((error as AppError).status).toBe(429);
    }
  });

  it("resets after the window", () => {
    const key = `test:${Math.random()}`;
    rateLimit(key, 1, 60_000, 0);
    expect(() => rateLimit(key, 1, 60_000, 61_000)).not.toThrow();
  });
});

describe("validation", () => {
  it("never lets registration create an admin", () => {
    const result = registerSchema.safeParse({ displayName: "Mallory", email: "m@example.com", password: "password123", role: "admin", acceptTerms: true });
    expect(result.success).toBe(false);
  });

  it("normalizes email and requires accepted terms", () => {
    const ok = registerSchema.parse({ displayName: "Asha", email: "  Asha@Example.COM ", password: "password123", role: "donor", acceptTerms: true });
    expect(ok.email).toBe("asha@example.com");
    expect(registerSchema.safeParse({ ...ok, password: "password123", acceptTerms: false }).success).toBe(false);
  });

  it("coerces claim form fields and uppercases the reference", () => {
    const claim = claimSchema.parse({ campaignId: "cmp-1", provider: "bKash", amount: "2500", transactionId: " bka8n2k91q ", senderLastFour: "4821", paidAt: "2026-10-01T10:00:00.000Z" });
    expect(claim.amount).toBe(2500);
    expect(claim.transactionId).toBe("BKA8N2K91Q");
  });

  it("rejects fractional and oversized amounts", () => {
    const base = { campaignId: "cmp-1", provider: "bKash", transactionId: "BKA8N2K91Q", senderLastFour: "4821", paidAt: "2026-10-01T10:00:00.000Z" };
    expect(claimSchema.safeParse({ ...base, amount: "10.5" }).success).toBe(false);
    expect(claimSchema.safeParse({ ...base, amount: "600000" }).success).toBe(false);
  });
});
