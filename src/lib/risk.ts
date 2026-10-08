import type { DonationClaim } from "@/lib/types";

type ClaimInput = Pick<
  DonationClaim,
  "amount" | "transactionId" | "paidAt" | "evidenceName" | "senderLastFour"
> & { evidenceHash?: string };

export const FLAG_THRESHOLD = 60;
export const MAX_CLAIM_AMOUNT = 500_000;

export function normalizeReference(reference: string) {
  return reference.trim().toUpperCase().replace(/\s+/g, "");
}

export function assessClaimRisk(input: ClaimInput, existing: DonationClaim[], now = Date.now()) {
  let score = 0;
  const flags: string[] = [];
  const normalizedId = normalizeReference(input.transactionId);

  if (existing.some((claim) => normalizeReference(claim.transactionId) === normalizedId)) {
    score += 70;
    flags.push("Transaction ID already used");
  }

  if (input.evidenceHash && existing.some((claim) => claim.evidenceHash === input.evidenceHash)) {
    score += 60;
    flags.push("Identical evidence file was already submitted");
  }

  if (!/^[a-z0-9-]{6,24}$/i.test(input.transactionId.trim())) {
    score += 20;
    flags.push("Unusual transaction ID format");
  }

  if (!/^\d{4}$/.test(input.senderLastFour)) {
    score += 15;
    flags.push("Sender digits are incomplete");
  }

  if (input.amount <= 0 || input.amount > MAX_CLAIM_AMOUNT) {
    score += 35;
    flags.push("Amount is outside normal review limits");
  } else if (input.amount >= 100_000) {
    score += 10;
    flags.push("High-value payment needs enhanced review");
  }

  const paymentTime = new Date(input.paidAt).getTime();
  if (!Number.isFinite(paymentTime) || paymentTime > now + 5 * 60_000) {
    score += 30;
    flags.push("Payment time is invalid or in the future");
  } else if (paymentTime < now - 90 * 24 * 60 * 60_000) {
    score += 10;
    flags.push("Payment is older than 90 days");
  }

  if (!input.evidenceName.trim()) {
    score += 30;
    flags.push("No payment evidence attached");
  }

  return { score: Math.min(score, 100), flags };
}

export function maskReference(reference: string) {
  if (reference.length <= 5) return "•••••";
  return `${reference.slice(0, 3)}••••${reference.slice(-3)}`;
}
