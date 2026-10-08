import "server-only";

import { badRequest, conflict, forbidden, notFound } from "@/lib/errors";
import { formatBDT } from "@/lib/format";
import { FLAG_THRESHOLD, assessClaimRisk, maskReference } from "@/lib/risk";
import { createSeedData, type MemoryDatabase } from "@/lib/seed";
import type {
  AuditEvent,
  Campaign,
  CampaignRecord,
  CampaignReport,
  CampaignStatus,
  CampaignUpdate,
  ClaimAppeal,
  DashboardSnapshot,
  Disbursement,
  DonationClaim,
  Notification,
  PaymentMethod,
  PublicDonation,
  StoredFile,
  User,
  UserProfile,
  UserRole,
} from "@/lib/types";

/*
 * In-memory repository. Every read and write goes through these functions so the store can be
 * replaced with a transactional database without touching routes or pages. Data lives for the
 * lifetime of the Node process and is not shared between instances.
 */

declare global {
  var __shohayDb: MemoryDatabase | undefined;
}

let db = globalThis.__shohayDb ?? createSeedData();
globalThis.__shohayDb = db;

/** Test helper: restore the seeded state. */
export function resetDatabase() {
  db = createSeedData();
  globalThis.__shohayDb = db;
}

export const PUBLIC_CAMPAIGN_STATUSES: CampaignStatus[] = ["active", "funded", "closed"];
export const DEMERIT_BLOCK_THRESHOLD = 10;
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const nowIso = () => new Date().toISOString();
const clone = <T>(value: T): T => structuredClone(value);

function addAudit(event: Omit<AuditEvent, "id" | "createdAt">) {
  db.audit.unshift({ ...event, id: id("aud"), createdAt: nowIso() });
}

function notify(userIds: Iterable<string>, message: Omit<Notification, "id" | "userId" | "createdAt" | "readAt">) {
  for (const userId of new Set(userIds)) {
    db.notifications.unshift({ ...message, id: id("ntf"), userId, createdAt: nowIso() });
  }
}

const adminIds = () => db.users.filter((user) => user.role === "admin").map((user) => user.id);

/* ----------------------------------------------------------------------------- users */

export function toProfile(user: User): UserProfile {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, sessionVersion, ...profile } = user;
  return { ...profile };
}

export function getUserById(userId: string) {
  return db.users.find((user) => user.id === userId);
}

export function getUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return db.users.find((user) => user.email === normalized);
}

export function createUser(input: { email: string; displayName: string; role: Exclude<UserRole, "admin">; passwordHash: string }) {
  if (getUserByEmail(input.email)) throw conflict("An account with this email already exists.");
  const user: User = {
    id: id("usr"),
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim(),
    role: input.role,
    passwordHash: input.passwordHash,
    sessionVersion: 0,
    verified: false,
    demeritPoints: 0,
    createdAt: nowIso(),
  };
  db.users.push(user);
  addAudit({ entityType: "user", entityId: user.id, action: "user.registered", actor: user.displayName, detail: `New ${user.role} account created.` });
  notify([user.id], {
    title: "Welcome to Shohay",
    body: user.role === "fundraiser"
      ? "Start a cause when you are ready. Every campaign is privately reviewed before it goes public."
      : "Find a cause, send money to a verified account, then record your gift privately for review.",
    href: user.role === "fundraiser" ? "/campaigns/new" : "/campaigns",
  });
  return user;
}

export function updateDisplayName(userId: string, displayName: string) {
  const user = getUserById(userId);
  if (!user) throw notFound("Account not found.");
  user.displayName = displayName.trim();
  for (const campaign of db.campaigns) if (campaign.fundraiserId === userId) campaign.fundraiserName = user.displayName;
  return user;
}

/** Replaces the password hash and revokes every existing session. */
export function setPasswordHash(userId: string, passwordHash: string) {
  const user = getUserById(userId);
  if (!user) throw notFound("Account not found.");
  user.passwordHash = passwordHash;
  user.sessionVersion += 1;
  addAudit({ entityType: "user", entityId: userId, action: "user.password_changed", actor: user.displayName, detail: "Password changed; other sessions were signed out." });
  return user;
}

export function revokeSessions(userId: string) {
  const user = getUserById(userId);
  if (!user) throw notFound("Account not found.");
  user.sessionVersion += 1;
  addAudit({ entityType: "user", entityId: userId, action: "user.sessions_revoked", actor: user.displayName, detail: "All other sessions were signed out." });
  return user;
}

export function storePasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
  db.resetTokens = db.resetTokens.filter((token) => token.userId !== userId && new Date(token.expiresAt).getTime() > Date.now());
  db.resetTokens.push({ userId, tokenHash, expiresAt: expiresAt.toISOString() });
}

/** Marks a reset token used and returns its owner, or undefined if it is invalid or expired. */
export function consumePasswordResetToken(tokenHash: string) {
  const token = db.resetTokens.find((entry) => entry.tokenHash === tokenHash);
  if (!token || token.usedAt || new Date(token.expiresAt).getTime() < Date.now()) return undefined;
  token.usedAt = nowIso();
  return getUserById(token.userId);
}

/* ------------------------------------------------------------------------- campaigns */

function hydrate(record: CampaignRecord): Campaign {
  let verifiedAmount = 0;
  let donorCount = 0;
  for (const claim of db.claims) {
    if (claim.campaignId === record.id && claim.status === "approved") {
      verifiedAmount += claim.amount;
      donorCount += 1;
    }
  }
  const verifiedDisbursedAmount = db.disbursements
    .filter((entry) => entry.campaignId === record.id && entry.status === "verified")
    .reduce((sum, entry) => sum + entry.amount, 0);
  return { ...clone(record), verifiedAmount, verifiedDisbursedAmount, donorCount };
}

/** Strips private review data: unverified payment accounts and document references. */
export function toPublicCampaign(campaign: Campaign): Campaign {
  return {
    ...campaign,
    paymentMethods: campaign.paymentMethods.filter((method) => method.status === "verified"),
    documentFileIds: [],
    reviewNote: undefined,
  };
}

export function isPublicCampaign(campaign: Pick<CampaignRecord, "status">) {
  return PUBLIC_CAMPAIGN_STATUSES.includes(campaign.status);
}

export function canManageCampaign(campaign: Pick<CampaignRecord, "fundraiserId">, viewer?: { userId: string; role: UserRole } | null) {
  return Boolean(viewer && (viewer.role === "admin" || viewer.userId === campaign.fundraiserId));
}

export function getPublicCampaigns() {
  return db.campaigns.filter(isPublicCampaign).map((record) => toPublicCampaign(hydrate(record)));
}

export function getCampaignBySlug(slug: string) {
  const record = db.campaigns.find((campaign) => campaign.slug === slug);
  return record && hydrate(record);
}

export function getCampaignById(campaignId: string) {
  const record = db.campaigns.find((campaign) => campaign.id === campaignId);
  return record && hydrate(record);
}

function requireCampaignRecord(campaignId: string) {
  const record = db.campaigns.find((campaign) => campaign.id === campaignId);
  if (!record) throw notFound("Campaign not found.");
  return record;
}

function requireOwnedCampaign(campaignId: string, fundraiserId: string) {
  const record = requireCampaignRecord(campaignId);
  if (record.fundraiserId !== fundraiserId) throw forbidden("You can only manage your own campaigns.");
  return record;
}

/** Keep `funded` in step with derived totals after approvals and reversals. */
function syncFundedStatus(record: CampaignRecord) {
  const { verifiedAmount } = hydrate(record);
  if (record.status === "active" && verifiedAmount >= record.goalAmount) {
    record.status = "funded";
    addAudit({ entityType: "campaign", entityId: record.id, action: "campaign.funded", actor: "System", detail: "Verified gifts reached the goal." });
    notify([record.fundraiserId], { title: "Your goal has been reached", body: `“${record.title}” is fully funded by verified gifts. Remember to publish disbursement evidence.`, href: `/dashboard/campaigns/${record.id}` });
  } else if (record.status === "funded" && verifiedAmount < record.goalAmount) {
    record.status = "active";
    addAudit({ entityType: "campaign", entityId: record.id, action: "campaign.reopened", actor: "System", detail: "Verified total fell below the goal after a reversal." });
  }
}

export function getPublicDonations(campaignId: string): PublicDonation[] {
  return db.claims
    .filter((claim) => claim.campaignId === campaignId && claim.status === "approved")
    .map((claim) => ({
      id: claim.id,
      amount: claim.amount,
      donorAlias: claim.donorAlias,
      provider: claim.provider,
      approvedAt: claim.reviewedAt ?? claim.submittedAt,
      reference: maskReference(claim.transactionId),
    }))
    .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt));
}

export function getPublicDisbursements(campaignId: string) {
  return db.disbursements
    .filter((entry) => entry.campaignId === campaignId && entry.status === "verified")
    .map(({ id: disbursementId, amount, recipient, description, reviewedAt, submittedAt }) => ({
      id: disbursementId,
      amount,
      recipient,
      description,
      verifiedAt: reviewedAt ?? submittedAt,
    }));
}

type CampaignInput = Pick<
  CampaignRecord,
  "title" | "summary" | "story" | "category" | "location" | "goalAmount" | "beneficiaryName" | "beneficiaryRelationship"
>;

function slugify(title: string, suffix: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
  return `${base || "cause"}-${suffix}`;
}

export function createCampaign(input: CampaignInput, fundraiser: User, documentFileIds: string[] = []) {
  const campaignId = id("cmp");
  const accents: CampaignRecord["accent"][] = ["mint", "sand", "lilac"];
  const record: CampaignRecord = {
    ...input,
    id: campaignId,
    slug: slugify(input.title, campaignId.slice(-5)),
    status: "under_review",
    fundraiserId: fundraiser.id,
    fundraiserName: fundraiser.displayName,
    beneficiaryVerified: false,
    documentsVerified: false,
    documentFileIds,
    createdAt: nowIso(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
    paymentMethods: [],
    updates: [],
    accent: accents[db.campaigns.length % accents.length],
  };
  db.campaigns.unshift(record);
  addAudit({ entityType: "campaign", entityId: campaignId, action: "campaign.submitted", actor: record.fundraiserName, detail: "Campaign submitted for identity, beneficiary, and document review." });
  notify(adminIds(), { title: "New campaign to review", body: `“${record.title}” is waiting for identity, beneficiary, and document checks.`, href: "/dashboard#campaigns" });
  return hydrate(record);
}

export function editCampaign(campaignId: string, input: CampaignInput, fundraiserId: string) {
  const record = requireOwnedCampaign(campaignId, fundraiserId);
  if (!["under_review", "changes_requested", "draft"].includes(record.status)) {
    throw badRequest("Live campaigns cannot be edited. Post an update instead.");
  }
  const { title, summary, story, category, location, goalAmount, beneficiaryName, beneficiaryRelationship } = input;
  Object.assign(record, { title, summary, story, category, location, goalAmount, beneficiaryName, beneficiaryRelationship });
  const resubmitted = record.status !== "under_review";
  record.status = "under_review";
  addAudit({ entityType: "campaign", entityId: campaignId, action: resubmitted ? "campaign.resubmitted" : "campaign.edited", actor: record.fundraiserName, detail: resubmitted ? "Changes made and campaign resubmitted for review." : "Campaign details edited during review." });
  if (resubmitted) notify(adminIds(), { title: "Campaign resubmitted", body: `“${record.title}” was updated after a change request.`, href: "/dashboard#campaigns" });
  return hydrate(record);
}

export type CampaignDecision = "activate" | "request_changes" | "reject" | "suspend" | "reinstate" | "close";

const campaignTransitions: Record<CampaignDecision, { from: CampaignStatus[]; to: CampaignStatus; title: string }> = {
  activate: { from: ["under_review", "changes_requested"], to: "active", title: "Your campaign is live" },
  request_changes: { from: ["under_review"], to: "changes_requested", title: "Changes requested on your campaign" },
  reject: { from: ["under_review", "changes_requested"], to: "rejected", title: "Your campaign was not approved" },
  suspend: { from: ["active", "funded"], to: "suspended", title: "Your campaign has been suspended" },
  reinstate: { from: ["suspended"], to: "active", title: "Your campaign has been reinstated" },
  close: { from: ["active", "funded"], to: "closed", title: "Your campaign has been closed" },
};

export function reviewCampaign(campaignId: string, decision: CampaignDecision, note: string) {
  const record = requireCampaignRecord(campaignId);
  const transition = campaignTransitions[decision];
  if (!transition.from.includes(record.status)) {
    throw badRequest(`A campaign that is ${record.status.replaceAll("_", " ")} cannot be ${decision.replaceAll("_", " ")}d.`);
  }
  if (decision === "activate" && !record.paymentMethods.some((method) => method.status === "verified")) {
    throw badRequest("Verify at least one payment destination before activating this campaign.");
  }
  record.status = transition.to;
  record.reviewNote = note;
  record.reviewedAt = nowIso();
  if (decision === "activate") {
    record.beneficiaryVerified = true;
    record.documentsVerified = true;
    record.deadline = new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString();
  }
  if (decision === "reinstate") syncFundedStatus(record);
  addAudit({ entityType: "campaign", entityId: campaignId, action: `campaign.${decision}`, actor: "Review team", detail: note });
  notify([record.fundraiserId], { title: transition.title, body: note, href: `/dashboard/campaigns/${record.id}` });
  return hydrate(record);
}

export function addPaymentMethod(campaignId: string, input: Omit<PaymentMethod, "id" | "status" | "reviewNote">, fundraiserId: string) {
  const record = requireOwnedCampaign(campaignId, fundraiserId);
  if (["closed", "rejected", "suspended"].includes(record.status)) throw badRequest("This campaign can no longer receive payment accounts.");
  const active = record.paymentMethods.filter((method) => method.status !== "rejected");
  if (active.length >= 4) throw badRequest("A campaign can list at most four payment destinations.");
  const normalized = input.accountNumber.replace(/\s+/g, "");
  if (active.some((method) => method.accountNumber.replace(/\s+/g, "") === normalized)) {
    throw conflict("This account is already listed on the campaign.");
  }
  const method: PaymentMethod = { ...input, id: id("pay"), status: "pending" };
  record.paymentMethods.push(method);
  addAudit({ entityType: "campaign", entityId: campaignId, action: "payment_method.added", actor: record.fundraiserName, detail: `${input.provider} account ending ${normalized.slice(-3)} submitted for verification.` });
  notify(adminIds(), { title: "Payment account to verify", body: `A ${input.provider} account was added to “${record.title}”.`, href: "/dashboard#campaigns" });
  return method;
}

export function reviewPaymentMethod(campaignId: string, methodId: string, decision: "verified" | "rejected", note: string) {
  const record = requireCampaignRecord(campaignId);
  const method = record.paymentMethods.find((entry) => entry.id === methodId);
  if (!method) throw notFound("Payment account not found.");
  if (method.status !== "pending") throw badRequest("This payment account has already been reviewed.");
  method.status = decision;
  method.reviewNote = note;
  addAudit({ entityType: "campaign", entityId: campaignId, action: `payment_method.${decision}`, actor: "Review team", detail: `${method.provider} account ${decision}: ${note}` });
  notify([record.fundraiserId], {
    title: decision === "verified" ? "Payment account verified" : "Payment account rejected",
    body: `${method.provider} account ${method.accountNumber}: ${note}`,
    href: `/dashboard/campaigns/${record.id}`,
  });
  return method;
}

export function addCampaignUpdate(campaignId: string, input: Pick<CampaignUpdate, "title" | "body" | "type">, fundraiserId: string) {
  const record = requireOwnedCampaign(campaignId, fundraiserId);
  if (!isPublicCampaign(record)) throw badRequest("Updates can be posted once the campaign is public.");
  const update: CampaignUpdate = { ...input, id: id("upd"), createdAt: nowIso() };
  record.updates.unshift(update);
  addAudit({ entityType: "campaign", entityId: campaignId, action: "campaign.update_posted", actor: record.fundraiserName, detail: input.title });
  notify(supporterIds(campaignId), { title: "Update on a cause you supported", body: `${record.title}: ${input.title}`, href: `/campaigns/${record.slug}#updates` });
  return update;
}

function supporterIds(campaignId: string) {
  return db.claims
    .filter((claim) => claim.campaignId === campaignId && claim.status === "approved" && claim.submitterId !== "usr-community")
    .map((claim) => claim.submitterId);
}

/* --------------------------------------------------------------------- disbursements */

export function createDisbursement(
  campaignId: string,
  input: Pick<Disbursement, "amount" | "recipient" | "description" | "evidenceName" | "evidenceFileId">,
  fundraiserId: string,
) {
  const record = requireOwnedCampaign(campaignId, fundraiserId);
  if (!isPublicCampaign(record)) throw badRequest("Disbursements can be recorded once the campaign is public.");
  const campaign = hydrate(record);
  const committed = db.disbursements
    .filter((entry) => entry.campaignId === campaignId && entry.status !== "rejected")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const available = campaign.verifiedAmount - committed;
  if (input.amount > available) {
    throw badRequest(`Only ${formatBDT(Math.max(0, available))} of verified gifts has not yet been reported as delivered.`);
  }
  const disbursement: Disbursement = { ...input, id: id("dsb"), campaignId, status: "pending", submittedAt: nowIso() };
  db.disbursements.unshift(disbursement);
  addAudit({ entityType: "disbursement", entityId: disbursement.id, action: "disbursement.submitted", actor: record.fundraiserName, detail: `${formatBDT(input.amount)} to ${input.recipient} submitted with evidence.` });
  notify(adminIds(), { title: "Disbursement evidence to verify", body: `${formatBDT(input.amount)} to ${input.recipient} for “${record.title}”.`, href: "/dashboard#disbursements" });
  return disbursement;
}

export function reviewDisbursement(disbursementId: string, decision: "verified" | "rejected", note: string) {
  const disbursement = db.disbursements.find((entry) => entry.id === disbursementId);
  if (!disbursement) throw notFound("Disbursement not found.");
  if (disbursement.status !== "pending") throw badRequest("This disbursement has already been reviewed.");
  const record = requireCampaignRecord(disbursement.campaignId);
  disbursement.status = decision;
  disbursement.reviewNote = note;
  disbursement.reviewedAt = nowIso();
  addAudit({ entityType: "disbursement", entityId: disbursementId, action: `disbursement.${decision}`, actor: "Review team", detail: note });
  notify([record.fundraiserId], {
    title: decision === "verified" ? "Disbursement verified" : "Disbursement evidence rejected",
    body: `${formatBDT(disbursement.amount)} to ${disbursement.recipient}: ${note}`,
    href: `/dashboard/campaigns/${record.id}`,
  });
  if (decision === "verified") {
    record.updates.unshift({
      id: id("upd"),
      title: `${formatBDT(disbursement.amount)} delivered to ${disbursement.recipient}`,
      body: `${disbursement.description} Evidence reviewed by the platform.`,
      createdAt: nowIso(),
      type: "transfer",
    });
    notify(supporterIds(record.id), { title: "Funds delivered for a cause you supported", body: `${formatBDT(disbursement.amount)} from “${record.title}” reached ${disbursement.recipient}.`, href: `/campaigns/${record.slug}#delivered` });
  }
  return disbursement;
}

/* ---------------------------------------------------------------------------- claims */

function requireClaim(claimId: string) {
  const claim = db.claims.find((entry) => entry.id === claimId);
  if (!claim) throw notFound("Claim not found.");
  return claim;
}

const campaignTitle = (campaignId: string) => db.campaigns.find((campaign) => campaign.id === campaignId)?.title ?? "a campaign";

export function createClaim(
  input: Pick<DonationClaim, "campaignId" | "amount" | "provider" | "transactionId" | "senderLastFour" | "paidAt" | "evidenceName" | "evidenceFileId" | "evidenceHash" | "note">,
  submitter: User,
) {
  if (submitter.demeritPoints >= DEMERIT_BLOCK_THRESHOLD) {
    throw forbidden("Submissions are paused for this account. You can appeal a rejected claim from your dashboard.");
  }
  const record = requireCampaignRecord(input.campaignId);
  if (record.status !== "active") throw badRequest("This campaign is not accepting new payment records.");
  if (!record.paymentMethods.some((method) => method.status === "verified" && method.provider === input.provider)) {
    throw badRequest("Choose one of the campaign's verified payment destinations.");
  }

  const risk = assessClaimRisk(input, db.claims);
  const claim: DonationClaim = {
    ...input,
    id: id("clm"),
    submitterId: submitter.id,
    donorAlias: `Anonymous #${input.senderLastFour}`,
    status: risk.score >= FLAG_THRESHOLD ? "flagged" : "pending_fundraiser",
    riskScore: risk.score,
    riskFlags: risk.flags,
    submittedAt: nowIso(),
  };
  db.claims.unshift(claim);
  addAudit({
    entityType: "claim",
    entityId: claim.id,
    action: "claim.submitted",
    actor: claim.donorAlias,
    detail: risk.flags.length ? `Submitted with ${risk.flags.length} automated risk flag(s).` : "Submitted and routed to the fundraiser for confirmation.",
  });
  notify([record.fundraiserId], { title: "New payment to confirm", body: `A ${formatBDT(claim.amount)} ${claim.provider} claim for “${record.title}” needs checking against your statement.`, href: "/dashboard" });
  return claim;
}

export function respondToClaim(claimId: string, response: "confirmed" | "disputed", note: string, fundraiserId: string) {
  const claim = requireClaim(claimId);
  const record = requireCampaignRecord(claim.campaignId);
  if (record.fundraiserId !== fundraiserId) throw forbidden("You can only reconcile payments for your own campaign.");
  if (!["pending_fundraiser", "flagged"].includes(claim.status) || claim.fundraiserResponse) {
    throw badRequest("This claim can no longer receive a fundraiser response.");
  }
  claim.fundraiserResponse = response;
  claim.fundraiserNote = note;
  claim.status = response === "confirmed" && claim.riskScore < FLAG_THRESHOLD ? "pending_admin" : "flagged";
  if (response === "disputed" && !claim.riskFlags.includes("Fundraiser disputed receipt")) {
    claim.riskFlags.push("Fundraiser disputed receipt");
    claim.riskScore = Math.min(100, claim.riskScore + 35);
  }
  addAudit({ entityType: "claim", entityId: claimId, action: `fundraiser.${response}`, actor: "Campaign fundraiser", detail: note || `Fundraiser ${response} the payment claim.` });
  notify([claim.submitterId], {
    title: response === "confirmed" ? "Fundraiser confirmed your payment" : "Your payment record needs attention",
    body: response === "confirmed"
      ? `Your ${formatBDT(claim.amount)} gift to “${record.title}” is now with an independent reviewer.`
      : `The fundraiser could not match your ${formatBDT(claim.amount)} payment. A reviewer will look at both sides.`,
    href: "/dashboard",
  });
  return claim;
}

export type ClaimDecision = "approved" | "rejected" | "more_info";

export function reviewClaim(claimId: string, decision: ClaimDecision, note: string, demerits = 0) {
  const claim = requireClaim(claimId);
  if (["approved", "rejected", "reversed"].includes(claim.status)) throw badRequest("This claim has already been decided.");
  if (claim.status === "pending_fundraiser" && decision !== "rejected") {
    throw badRequest("Wait for the fundraiser to check their statement before reviewing this claim.");
  }
  const title = campaignTitle(claim.campaignId);

  if (decision === "more_info") {
    claim.status = "more_info_requested";
    claim.infoRequest = note;
    claim.infoResponse = undefined;
    addAudit({ entityType: "claim", entityId: claimId, action: "claim.more_info_requested", actor: "Review team", detail: note });
    notify([claim.submitterId], { title: "A reviewer needs more information", body: `About your ${formatBDT(claim.amount)} gift to “${title}”: ${note}`, href: "/dashboard" });
    return claim;
  }

  if (decision === "approved" && claim.fundraiserResponse !== "confirmed") {
    throw badRequest("A fundraiser confirmation is required before approval.");
  }

  claim.status = decision;
  claim.adminNote = note;
  claim.reviewedAt = nowIso();

  if (decision === "approved") {
    syncFundedStatus(requireCampaignRecord(claim.campaignId));
  } else if (demerits > 0) {
    const user = getUserById(claim.submitterId);
    if (user) user.demeritPoints = Math.min(DEMERIT_BLOCK_THRESHOLD, user.demeritPoints + demerits);
    claim.demeritsApplied = demerits;
  }

  addAudit({
    entityType: "claim",
    entityId: claimId,
    action: `claim.${decision}`,
    actor: "Review team",
    detail: `${note}${decision === "rejected" && demerits ? ` ${demerits} demerit point(s) applied.` : ""}`,
  });
  notify([claim.submitterId], decision === "approved"
    ? { title: "Your gift was verified", body: `Your ${formatBDT(claim.amount)} ${claim.provider} gift to “${title}” is now part of the public record.`, href: `/receipts/${claim.id}` }
    : { title: "Your payment record was not approved", body: `${note}${demerits ? ` ${demerits} demerit point(s) were applied.` : ""} You can appeal from your dashboard.`, href: "/dashboard" });
  return claim;
}

export function respondToInfoRequest(claimId: string, response: string, userId: string) {
  const claim = requireClaim(claimId);
  if (claim.submitterId !== userId) throw notFound("Claim not found.");
  if (claim.status !== "more_info_requested") throw badRequest("No information has been requested for this claim.");
  claim.infoResponse = response;
  claim.status = claim.fundraiserResponse === "confirmed" ? "pending_admin" : claim.fundraiserResponse === "disputed" ? "flagged" : "pending_fundraiser";
  addAudit({ entityType: "claim", entityId: claimId, action: "claim.info_provided", actor: claim.donorAlias, detail: "The submitter answered the reviewer's question." });
  notify(adminIds(), { title: "Donor replied to an information request", body: `${claim.donorAlias} answered about a ${formatBDT(claim.amount)} claim.`, href: "/dashboard" });
  return claim;
}

/** Reverses an approved gift without deleting it; derived totals drop automatically. */
export function reverseClaim(claimId: string, note: string) {
  const claim = requireClaim(claimId);
  if (claim.status !== "approved") throw badRequest("Only approved claims can be reversed.");
  claim.status = "reversed";
  claim.reversalNote = note;
  syncFundedStatus(requireCampaignRecord(claim.campaignId));
  addAudit({ entityType: "claim", entityId: claimId, action: "claim.reversed", actor: "Review team", detail: note });
  notify([claim.submitterId], { title: "A verified gift was reversed", body: `Your ${formatBDT(claim.amount)} gift to “${campaignTitle(claim.campaignId)}” was removed from the public total: ${note}`, href: "/dashboard" });
  return claim;
}

export function getReceipt(claimId: string, userId: string) {
  const claim = db.claims.find((entry) => entry.id === claimId && entry.submitterId === userId && entry.status === "approved");
  if (!claim) return undefined;
  const campaign = getCampaignById(claim.campaignId);
  if (!campaign) return undefined;
  return {
    receiptNumber: `SHY-${claim.id.replace(/^clm-/, "").slice(0, 8).toUpperCase()}`,
    amount: claim.amount,
    provider: claim.provider,
    reference: maskReference(claim.transactionId),
    donorAlias: claim.donorAlias,
    paidAt: claim.paidAt,
    approvedAt: claim.reviewedAt ?? claim.submittedAt,
    campaign: { title: campaign.title, slug: campaign.slug, fundraiserName: campaign.fundraiserName, location: campaign.location },
  };
}

/* ----------------------------------------------------------------- reports & appeals */

export function createCampaignReport(input: Pick<CampaignReport, "campaignId" | "category" | "detail">, reporterId: string) {
  requireCampaignRecord(input.campaignId);
  const duplicate = db.reports.find(
    (report) => report.campaignId === input.campaignId && report.reporterId === reporterId && ["open", "reviewing"].includes(report.status),
  );
  if (duplicate) throw conflict("You already have an open report for this campaign.");

  const report: CampaignReport = { ...input, id: id("rpt"), reporterId, status: "open", submittedAt: nowIso() };
  db.reports.unshift(report);
  addAudit({ entityType: "campaign", entityId: input.campaignId, action: "campaign.reported", actor: "Anonymous reporter", detail: `A private ${input.category.replaceAll("_", " ")} report was submitted.` });
  notify(adminIds(), { title: "New safety report", body: `A ${input.category.replaceAll("_", " ")} report was filed about “${campaignTitle(input.campaignId)}”.`, href: "/dashboard#safety" });
  return report;
}

export function reviewCampaignReport(reportId: string, status: "resolved" | "dismissed", note: string) {
  const report = db.reports.find((entry) => entry.id === reportId);
  if (!report) throw notFound("Report not found.");
  if (["resolved", "dismissed"].includes(report.status)) throw badRequest("This report is already closed.");
  report.status = status;
  report.resolutionNote = note;
  report.reviewedAt = nowIso();
  addAudit({ entityType: "campaign", entityId: report.campaignId, action: `report.${status}`, actor: "Review team", detail: note });
  notify([report.reporterId], { title: `Your report was ${status}`, body: `About “${campaignTitle(report.campaignId)}”: ${note}`, href: "/dashboard" });
  return report;
}

export function createClaimAppeal(claimId: string, reason: string, userId: string) {
  const claim = requireClaim(claimId);
  if (claim.submitterId !== userId) throw notFound("Claim not found.");
  if (claim.status !== "rejected") throw badRequest("Only rejected claims can be appealed.");
  if (db.appeals.some((appeal) => appeal.claimId === claimId && appeal.status === "pending")) {
    throw conflict("An appeal is already pending for this claim.");
  }
  const appeal: ClaimAppeal = { id: id("apl"), claimId, userId, reason, status: "pending", submittedAt: nowIso() };
  db.appeals.unshift(appeal);
  addAudit({ entityType: "claim", entityId: claimId, action: "claim.appealed", actor: claim.donorAlias, detail: "The submitter requested an independent second review." });
  notify(adminIds(), { title: "New appeal", body: `${claim.donorAlias} appealed a rejected ${formatBDT(claim.amount)} claim.`, href: "/dashboard#safety" });
  return appeal;
}

export function reviewClaimAppeal(appealId: string, decision: "upheld" | "denied", note: string) {
  const appeal = db.appeals.find((entry) => entry.id === appealId);
  if (!appeal) throw notFound("Appeal not found.");
  if (appeal.status !== "pending") throw badRequest("This appeal has already been decided.");
  const claim = requireClaim(appeal.claimId);

  appeal.status = decision;
  appeal.resolutionNote = note;
  appeal.reviewedAt = nowIso();
  if (decision === "upheld") {
    const user = getUserById(appeal.userId);
    if (user) user.demeritPoints = Math.max(0, user.demeritPoints - (claim.demeritsApplied ?? 0));
    claim.demeritsApplied = 0;
    claim.adminNote = `Reopened after appeal: ${note}`;
    claim.reviewedAt = undefined;
    if (claim.fundraiserResponse === "confirmed") {
      claim.status = "pending_admin";
    } else {
      // Ask the fundraiser to check their statement again rather than approving on a dispute.
      claim.status = "pending_fundraiser";
      claim.fundraiserResponse = undefined;
      notify([requireCampaignRecord(claim.campaignId).fundraiserId], { title: "Please re-check a payment", body: `An appeal reopened a ${formatBDT(claim.amount)} claim. Check your statement again.`, href: "/dashboard" });
    }
  }
  addAudit({ entityType: "claim", entityId: appeal.claimId, action: `appeal.${decision}`, actor: "Independent reviewer", detail: note });
  notify([appeal.userId], { title: decision === "upheld" ? "Your appeal was upheld" : "Your appeal was denied", body: note, href: "/dashboard" });
  return appeal;
}

/* ---------------------------------------------------------------- notifications/files */

export function getNotifications(userId: string, limit = 50) {
  return db.notifications.filter((entry) => entry.userId === userId).slice(0, limit).map(clone);
}

export function getUnreadCount(userId: string) {
  return db.notifications.filter((entry) => entry.userId === userId && !entry.readAt).length;
}

export function markNotificationsRead(userId: string, notificationId?: string) {
  const readAt = nowIso();
  for (const entry of db.notifications) {
    if (entry.userId === userId && !entry.readAt && (!notificationId || entry.id === notificationId)) entry.readAt = readAt;
  }
}

export function addFileRecord(file: StoredFile) {
  db.files.push(file);
  return file;
}

export function getFileRecord(fileId: string) {
  return db.files.find((file) => file.id === fileId);
}

/** Who may download a private evidence file: reviewers, and the person who uploaded it. */
export function canAccessFile(file: StoredFile, viewer: { userId: string; role: UserRole }) {
  return viewer.role === "admin" || file.ownerId === viewer.userId;
}

/* ------------------------------------------------------------------------- dashboard */

export function getDashboardForUser(userId: string, role: UserRole): DashboardSnapshot {
  if (role === "admin") {
    return {
      campaigns: db.campaigns.map(hydrate),
      claims: db.claims.filter((claim) => claim.submitterId !== "usr-community").map(clone),
      users: db.users.map(toProfile),
      audit: db.audit.slice(0, 25).map(clone),
      reports: db.reports.map(clone),
      appeals: db.appeals.map(clone),
      disbursements: db.disbursements.map(clone),
    };
  }

  if (role === "fundraiser") {
    const campaigns = db.campaigns.filter((campaign) => campaign.fundraiserId === userId);
    const campaignIds = new Set(campaigns.map((campaign) => campaign.id));
    const claims = db.claims.filter((claim) => campaignIds.has(claim.campaignId) && claim.status !== "approved");
    const entityIds = new Set([...campaignIds, ...claims.map((claim) => claim.id)]);
    const disbursements = db.disbursements.filter((entry) => campaignIds.has(entry.campaignId));
    for (const entry of disbursements) entityIds.add(entry.id);
    const user = getUserById(userId);
    return {
      campaigns: campaigns.map(hydrate),
      // Fundraisers reconcile against their statement; they never see who submitted or the raw evidence.
      claims: claims.map((claim) => ({
        ...clone(claim),
        submitterId: "",
        evidenceName: "Private — reviewer access only",
        evidenceFileId: undefined,
        evidenceHash: undefined,
        note: undefined,
        infoRequest: undefined,
        infoResponse: undefined,
        demeritsApplied: undefined,
      })),
      users: user ? [toProfile(user)] : [],
      audit: db.audit.filter((event) => entityIds.has(event.entityId)).slice(0, 15).map(clone),
      reports: [],
      appeals: [],
      disbursements: disbursements.map(clone),
    };
  }

  const claims = db.claims.filter((claim) => claim.submitterId === userId);
  const campaignIds = new Set(claims.map((claim) => claim.campaignId));
  const claimIds = new Set(claims.map((claim) => claim.id));
  const user = getUserById(userId);
  return {
    campaigns: db.campaigns.filter((campaign) => campaignIds.has(campaign.id)).map((record) => toPublicCampaign(hydrate(record))),
    claims: claims.map((claim) => ({ ...clone(claim), evidenceHash: undefined, riskFlags: [], riskScore: 0 })),
    users: user ? [toProfile(user)] : [],
    audit: db.audit.filter((event) => claimIds.has(event.entityId)).slice(0, 15).map(clone),
    reports: db.reports.filter((report) => report.reporterId === userId).map(clone),
    appeals: db.appeals.filter((appeal) => appeal.userId === userId).map(clone),
    disbursements: [],
  };
}

export function getPlatformStats() {
  const campaigns = getPublicCampaigns();
  return {
    totalVerified: campaigns.reduce((total, campaign) => total + campaign.verifiedAmount, 0),
    totalDelivered: campaigns.reduce((total, campaign) => total + campaign.verifiedDisbursedAmount, 0),
    totalGifts: campaigns.reduce((total, campaign) => total + campaign.donorCount, 0),
    campaignCount: campaigns.length,
  };
}
