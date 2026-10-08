export type UserRole = "donor" | "fundraiser" | "admin";
export type CampaignStatus =
  | "draft"
  | "under_review"
  | "changes_requested"
  | "active"
  | "funded"
  | "closed"
  | "rejected"
  | "suspended";
export type ClaimStatus =
  | "pending_fundraiser"
  | "pending_admin"
  | "more_info_requested"
  | "flagged"
  | "approved"
  | "rejected"
  | "reversed";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type AppealStatus = "pending" | "upheld" | "denied";
export type VerificationStatus = "pending" | "verified" | "rejected";

/** Stored account record. Never send this to a browser — use `UserProfile`. */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  /** Incremented to revoke every outstanding session for the account. */
  sessionVersion: number;
  verified: boolean;
  demeritPoints: number;
  createdAt: string;
}

export type UserProfile = Omit<User, "passwordHash" | "sessionVersion">;

export interface PaymentMethod {
  id: string;
  provider: "bKash" | "Nagad" | "Rocket" | "Bank";
  accountNumber: string;
  accountName: string;
  type: "Personal" | "Merchant" | "Bank account";
  status: VerificationStatus;
  reviewNote?: string;
}

export interface CampaignUpdate {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  type: "update" | "milestone" | "transfer";
}

export interface CampaignRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  story: string;
  category: "Medical" | "Emergency" | "Education" | "Food support";
  location: string;
  goalAmount: number;
  status: CampaignStatus;
  fundraiserId: string;
  fundraiserName: string;
  beneficiaryName: string;
  beneficiaryRelationship: string;
  beneficiaryVerified: boolean;
  documentsVerified: boolean;
  documentFileIds: string[];
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  deadline: string;
  paymentMethods: PaymentMethod[];
  updates: CampaignUpdate[];
  accent: "mint" | "sand" | "lilac";
}

/** A campaign with totals derived from approved claims and verified disbursements. */
export interface Campaign extends CampaignRecord {
  verifiedAmount: number;
  verifiedDisbursedAmount: number;
  donorCount: number;
}

export interface DonationClaim {
  id: string;
  campaignId: string;
  submitterId: string;
  donorAlias: string;
  amount: number;
  provider: PaymentMethod["provider"];
  transactionId: string;
  senderLastFour: string;
  paidAt: string;
  evidenceName: string;
  evidenceFileId?: string;
  evidenceHash?: string;
  note?: string;
  status: ClaimStatus;
  riskScore: number;
  riskFlags: string[];
  fundraiserResponse?: "confirmed" | "disputed";
  fundraiserNote?: string;
  adminNote?: string;
  infoRequest?: string;
  infoResponse?: string;
  reversalNote?: string;
  reviewedAt?: string;
  demeritsApplied?: number;
  submittedAt: string;
}

export interface Disbursement {
  id: string;
  campaignId: string;
  amount: number;
  recipient: string;
  description: string;
  evidenceName: string;
  evidenceFileId?: string;
  status: VerificationStatus;
  reviewNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface CampaignReport {
  id: string;
  campaignId: string;
  reporterId: string;
  category: "false_story" | "wrong_payment_account" | "privacy" | "fund_misuse" | "other";
  detail: string;
  status: ReportStatus;
  resolutionNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface ClaimAppeal {
  id: string;
  claimId: string;
  userId: string;
  reason: string;
  status: AppealStatus;
  resolutionNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface AuditEvent {
  id: string;
  entityType: "campaign" | "claim" | "user" | "disbursement";
  entityId: string;
  action: string;
  actor: string;
  detail: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  href?: string;
  readAt?: string;
  createdAt: string;
}

export interface StoredFile {
  id: string;
  ownerId: string;
  fileName: string;
  mimeType: string;
  size: number;
  sha256: string;
  createdAt: string;
}

export interface PasswordResetToken {
  tokenHash: string;
  userId: string;
  expiresAt: string;
  usedAt?: string;
}

export interface PublicDonation {
  id: string;
  amount: number;
  donorAlias: string;
  provider: PaymentMethod["provider"];
  approvedAt: string;
  reference: string;
}

export interface DashboardSnapshot {
  claims: DonationClaim[];
  campaigns: Campaign[];
  users: UserProfile[];
  audit: AuditEvent[];
  reports: CampaignReport[];
  appeals: ClaimAppeal[];
  disbursements: Disbursement[];
}
