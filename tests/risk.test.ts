import { describe, expect, it } from "vitest";

import { assessClaimRisk, maskReference, normalizeReference } from "@/lib/risk";
import type { DonationClaim } from "@/lib/types";

const now = Date.parse("2026-10-03T12:00:00Z");
const clean = {
  amount: 2_000,
  transactionId: "BKA8N2K91Q",
  senderLastFour: "4821",
  paidAt: new Date(now - 60 * 60_000).toISOString(),
  evidenceName: "receipt.png",
};

describe("assessClaimRisk", () => {
  it("passes a well-formed recent claim", () => {
    expect(assessClaimRisk(clean, [], now)).toEqual({ score: 0, flags: [] });
  });

  it("flags a reused transaction ID regardless of case and spacing", () => {
    const existing = [{ transactionId: "bka8n2k91q " } as DonationClaim];
    const result = assessClaimRisk(clean, existing, now);
    expect(result.flags).toContain("Transaction ID already used");
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it("flags an identical evidence file by hash", () => {
    const existing = [{ transactionId: "OTHER123", evidenceHash: "abc" } as DonationClaim];
    expect(assessClaimRisk({ ...clean, evidenceHash: "abc" }, existing, now).flags).toContain("Identical evidence file was already submitted");
  });

  it("flags future and very old payment times", () => {
    expect(assessClaimRisk({ ...clean, paidAt: new Date(now + 60 * 60_000).toISOString() }, [], now).flags).toContain("Payment time is invalid or in the future");
    expect(assessClaimRisk({ ...clean, paidAt: new Date(now - 120 * 86_400_000).toISOString() }, [], now).flags).toContain("Payment is older than 90 days");
  });

  it("caps the score at 100", () => {
    const result = assessClaimRisk({ amount: -1, transactionId: "x", senderLastFour: "1", paidAt: "nope", evidenceName: "" }, [], now);
    expect(result.score).toBe(100);
    expect(result.flags.length).toBeGreaterThan(3);
  });
});

describe("references", () => {
  it("masks all but the first and last three characters", () => {
    expect(maskReference("BKA8N2K91Q")).toBe("BKA••••91Q");
    expect(maskReference("ABC")).toBe("•••••");
  });

  it("normalizes case and whitespace", () => {
    expect(normalizeReference(" bka 8n2 ")).toBe("BKA8N2");
  });
});
