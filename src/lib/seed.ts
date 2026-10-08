import "server-only";

import { env } from "@/lib/env";
import { hashPasswordSync } from "@/lib/password";
import type {
  AuditEvent,
  CampaignRecord,
  CampaignReport,
  ClaimAppeal,
  Disbursement,
  DonationClaim,
  Notification,
  PasswordResetToken,
  StoredFile,
  User,
} from "@/lib/types";

export interface MemoryDatabase {
  users: User[];
  campaigns: CampaignRecord[];
  claims: DonationClaim[];
  disbursements: Disbursement[];
  audit: AuditEvent[];
  reports: CampaignReport[];
  appeals: ClaimAppeal[];
  notifications: Notification[];
  files: StoredFile[];
  resetTokens: PasswordResetToken[];
}

export const DEMO_PASSWORD = "demo1234";

const DAY = 24 * 60 * 60_000;

export function createSeedData(now = Date.now()): MemoryDatabase {
  const db: MemoryDatabase = {
    users: [],
    campaigns: [],
    claims: [],
    disbursements: [],
    audit: [],
    reports: [],
    appeals: [],
    notifications: [],
    files: [],
    resetTokens: [],
  };

  if (env.bootstrapAdmin) {
    db.users.push({
      id: "usr-admin-bootstrap",
      email: env.bootstrapAdmin.email.toLowerCase(),
      displayName: env.bootstrapAdmin.displayName,
      role: "admin",
      passwordHash: hashPasswordSync(env.bootstrapAdmin.password),
      sessionVersion: 0,
      verified: true,
      demeritPoints: 0,
      createdAt: new Date(now).toISOString(),
    });
  }

  if (env.demoData) addDemoData(db, now);
  return db;
}

function addDemoData(db: MemoryDatabase, now: number) {
  const daysAgo = (days: number) => new Date(now - days * DAY).toISOString();
  const daysAhead = (days: number) => new Date(now + days * DAY).toISOString();
  const demoHash = hashPasswordSync(DEMO_PASSWORD);

  const user = (
    id: string,
    email: string,
    displayName: string,
    role: User["role"],
    createdDaysAgo: number,
    demeritPoints = 0,
    passwordHash = demoHash,
  ): User => ({
    id,
    email,
    displayName,
    role,
    passwordHash,
    sessionVersion: 0,
    verified: true,
    demeritPoints,
    createdAt: daysAgo(createdDaysAgo),
  });

  db.users.push(
    user("usr-donor-1", "donor@shohay.demo", "Anonymous donor #4821", "donor", 210, 2),
    user("usr-fundraiser-1", "fundraiser@shohay.demo", "Rafiq Hasan", "fundraiser", 480),
    user("usr-fundraiser-2", "nusrat@shohay.demo", "Nusrat Jahan", "fundraiser", 320, 0, ""),
    user("usr-admin-1", "admin@shohay.demo", "Review team", "admin", 600),
    // Owner of historical seeded gifts; an empty hash means it can never sign in.
    user("usr-community", "community@shohay.demo", "Community donors", "donor", 700, 0, ""),
  );

  db.campaigns.push(
    {
      id: "cmp-ayesha",
      slug: "ayesha-heart-surgery",
      title: "Help Ayesha get the heart surgery she needs",
      summary:
        "A six-year-old from Cumilla needs urgent corrective heart surgery at the National Heart Foundation.",
      story:
        "Ayesha was born with a congenital heart condition. Her family has covered years of appointments, but the recommended surgery is beyond their means. The campaign target covers the procedure, hospital stay, medicine, and a small recovery reserve.\n\nEvery approved donation is recorded here, and the fundraiser must publish proof when funds are handed to the hospital or family.",
      category: "Medical",
      location: "Cumilla, Bangladesh",
      goalAmount: 450_000,
      status: "active",
      fundraiserId: "usr-fundraiser-1",
      fundraiserName: "Rafiq Hasan",
      beneficiaryName: "Ayesha Akter",
      beneficiaryRelationship: "Family representative verified by platform",
      beneficiaryVerified: true,
      documentsVerified: true,
      documentFileIds: [],
      createdAt: daysAgo(18),
      deadline: daysAhead(12),
      paymentMethods: [
        { id: "pay-1", provider: "bKash", accountNumber: "01712 344 832", accountName: "Rafiq Hasan", type: "Personal", status: "verified" },
        { id: "pay-2", provider: "Nagad", accountNumber: "01855 102 744", accountName: "Rafiq Hasan", type: "Personal", status: "verified" },
      ],
      updates: [
        { id: "upd-1", title: "Surgery date confirmed", body: "The hospital has reserved a date for Ayesha's procedure later this month.", createdAt: daysAgo(2), type: "milestone" },
        { id: "upd-2", title: "First hospital deposit verified", body: "৳150,000 was deposited directly with the hospital. Receipt reviewed by the platform.", createdAt: daysAgo(6), type: "transfer" },
      ],
      accent: "mint",
    },
    {
      id: "cmp-rashid",
      slug: "rebuild-rashids-home",
      title: "Rebuild Rashid's home after the river erosion",
      summary:
        "A family of five in Kurigram lost their home and essential belongings to sudden river erosion.",
      story:
        "Rashid's family needs a safe structure before the next monsoon. Local volunteers have verified the land and construction estimate.",
      category: "Emergency",
      location: "Kurigram, Bangladesh",
      goalAmount: 280_000,
      status: "active",
      fundraiserId: "usr-fundraiser-2",
      fundraiserName: "Nusrat Jahan",
      beneficiaryName: "Rashid Mia",
      beneficiaryRelationship: "Community volunteer referral",
      beneficiaryVerified: true,
      documentsVerified: true,
      documentFileIds: [],
      createdAt: daysAgo(12),
      deadline: daysAhead(23),
      paymentMethods: [
        { id: "pay-3", provider: "bKash", accountNumber: "01633 884 211", accountName: "Nusrat Jahan", type: "Merchant", status: "verified" },
      ],
      updates: [
        { id: "upd-3", title: "Materials estimate reviewed", body: "Two local supplier quotations were checked by the review team.", createdAt: daysAgo(4), type: "update" },
      ],
      accent: "sand",
    },
    {
      id: "cmp-students",
      slug: "school-year-for-12-students",
      title: "Keep 12 students in school for a full year",
      summary:
        "Books, uniforms, fees, and transport for twelve students at risk of dropping out in Mymensingh.",
      story: "The school and guardians supplied enrollment records and cost breakdowns for each student.",
      category: "Education",
      location: "Mymensingh, Bangladesh",
      goalAmount: 180_000,
      status: "funded",
      fundraiserId: "usr-fundraiser-2",
      fundraiserName: "Nusrat Jahan",
      beneficiaryName: "12 verified students",
      beneficiaryRelationship: "School administration referral",
      beneficiaryVerified: true,
      documentsVerified: true,
      documentFileIds: [],
      createdAt: daysAgo(45),
      deadline: daysAgo(3),
      paymentMethods: [],
      updates: [
        { id: "upd-4", title: "Fully funded", body: "All twelve students have received their materials and fee support.", createdAt: daysAgo(3), type: "transfer" },
      ],
      accent: "lilac",
    },
    {
      id: "cmp-sylhet-food",
      slug: "food-packs-for-40-families-in-sylhet",
      title: "Monthly food packs for 40 flood-affected families in Sylhet",
      summary: "Rice, lentils, oil, and hygiene supplies for families displaced by flash flooding in Sunamganj.",
      story:
        "A local relief committee has listed forty families whose homes and crops were damaged. Each pack costs ৳3,000 and covers a family for one month. Supplier quotations and the committee's beneficiary list have been shared privately with reviewers.",
      category: "Food support",
      location: "Sunamganj, Bangladesh",
      goalAmount: 120_000,
      status: "under_review",
      fundraiserId: "usr-fundraiser-1",
      fundraiserName: "Rafiq Hasan",
      beneficiaryName: "Sunamganj relief committee (40 families)",
      beneficiaryRelationship: "Volunteer coordinator for the committee",
      beneficiaryVerified: false,
      documentsVerified: false,
      documentFileIds: [],
      createdAt: daysAgo(1),
      deadline: daysAhead(30),
      paymentMethods: [
        { id: "pay-4", provider: "Rocket", accountNumber: "01912 553 090", accountName: "Rafiq Hasan", type: "Personal", status: "pending" },
      ],
      updates: [],
      accent: "sand",
    },
  );

  db.claims.push(
    {
      id: "clm-pending-1",
      campaignId: "cmp-ayesha",
      submitterId: "usr-donor-1",
      donorAlias: "Anonymous #5930",
      amount: 2_500,
      provider: "Nagad",
      transactionId: "NAG7P42M6X",
      senderLastFour: "5930",
      paidAt: daysAgo(1),
      evidenceName: "nagad-receipt.jpg",
      status: "pending_admin",
      riskScore: 0,
      riskFlags: [],
      fundraiserResponse: "confirmed",
      fundraiserNote: "Matched in my Nagad statement.",
      submittedAt: daysAgo(1),
    },
    {
      id: "clm-awaiting-1",
      campaignId: "cmp-ayesha",
      submitterId: "usr-donor-1",
      donorAlias: "Anonymous #4821",
      amount: 1_000,
      provider: "bKash",
      transactionId: "BKA3QW77LM",
      senderLastFour: "4821",
      paidAt: daysAgo(0.2),
      evidenceName: "bkash-1000.png",
      status: "pending_fundraiser",
      riskScore: 0,
      riskFlags: [],
      submittedAt: daysAgo(0.2),
    },
    {
      id: "clm-flagged-1",
      campaignId: "cmp-rashid",
      submitterId: "usr-donor-1",
      donorAlias: "Anonymous #1178",
      amount: 25_000,
      provider: "bKash",
      transactionId: "BKA-DUP-1178",
      senderLastFour: "1178",
      paidAt: daysAgo(2),
      evidenceName: "receipt-edited.png",
      status: "flagged",
      riskScore: 78,
      riskFlags: ["Fundraiser could not match payment", "Evidence appears edited"],
      fundraiserResponse: "disputed",
      fundraiserNote: "This reference does not appear in the recipient statement.",
      submittedAt: daysAgo(2),
    },
    {
      id: "clm-rejected-1",
      campaignId: "cmp-rashid",
      submitterId: "usr-donor-1",
      donorAlias: "Anonymous #4821",
      amount: 10_000,
      provider: "bKash",
      transactionId: "BKA-OLD-4401",
      senderLastFour: "4821",
      paidAt: daysAgo(31),
      evidenceName: "old-claim.jpg",
      status: "rejected",
      riskScore: 95,
      riskFlags: ["Transaction ID reused", "Recipient statement mismatch"],
      fundraiserResponse: "disputed",
      adminNote: "Rejected as duplicate evidence. Two demerits applied.",
      reviewedAt: daysAgo(29),
      demeritsApplied: 2,
      submittedAt: daysAgo(30),
    },
    {
      id: "clm-approved-1",
      campaignId: "cmp-ayesha",
      submitterId: "usr-donor-1",
      donorAlias: "Anonymous #4821",
      amount: 5_000,
      provider: "bKash",
      transactionId: "BKA8N2K91Q",
      senderLastFour: "4821",
      paidAt: daysAgo(3),
      evidenceName: "payment-bkash-4821.jpg",
      status: "approved",
      riskScore: 0,
      riskFlags: [],
      fundraiserResponse: "confirmed",
      adminNote: "Provider reference and recipient statement matched.",
      reviewedAt: daysAgo(2),
      submittedAt: daysAgo(3),
    },
    ...historicalGifts("cmp-ayesha", "AY", 307_500, 183, 17, "bKash", now),
    ...historicalGifts("cmp-rashid", "RA", 168_750, 96, 11, "bKash", now),
    ...historicalGifts("cmp-students", "ST", 180_000, 73, 44, "Nagad", now),
  );

  db.disbursements.push(
    {
      id: "dsb-1",
      campaignId: "cmp-ayesha",
      amount: 150_000,
      recipient: "National Heart Foundation Hospital",
      description: "Advance deposit for surgery and ICU stay.",
      evidenceName: "nhf-deposit-receipt.pdf",
      status: "verified",
      reviewNote: "Hospital receipt matched the deposit amount and patient file.",
      submittedAt: daysAgo(7),
      reviewedAt: daysAgo(6),
    },
    {
      id: "dsb-2",
      campaignId: "cmp-rashid",
      amount: 65_000,
      recipient: "Kurigram building supplies",
      description: "Corrugated sheets, timber frame, and concrete pillars.",
      evidenceName: "supplier-invoice.pdf",
      status: "verified",
      reviewNote: "Invoice and delivery photos checked with the local volunteer.",
      submittedAt: daysAgo(5),
      reviewedAt: daysAgo(4),
    },
    {
      id: "dsb-3",
      campaignId: "cmp-rashid",
      amount: 30_000,
      recipient: "Local mason team",
      description: "Labour for foundation and frame — first instalment.",
      evidenceName: "labour-agreement.jpg",
      status: "pending",
      submittedAt: daysAgo(1),
    },
    {
      id: "dsb-4",
      campaignId: "cmp-students",
      amount: 180_000,
      recipient: "Mymensingh Model School",
      description: "Annual fees, books, uniforms, and transport passes for twelve students.",
      evidenceName: "school-receipts.pdf",
      status: "verified",
      reviewNote: "School receipts and signed guardian acknowledgements reviewed.",
      submittedAt: daysAgo(4),
      reviewedAt: daysAgo(3),
    },
  );

  db.audit.push(
    { id: "aud-3", entityType: "campaign", entityId: "cmp-sylhet-food", action: "campaign.submitted", actor: "Rafiq Hasan", detail: "Campaign submitted for identity, beneficiary, and document review.", createdAt: daysAgo(1) },
    { id: "aud-1", entityType: "claim", entityId: "clm-approved-1", action: "claim.approved", actor: "Review team", detail: "Evidence, provider reference, and recipient statement matched.", createdAt: daysAgo(2) },
    { id: "aud-2", entityType: "disbursement", entityId: "dsb-1", action: "disbursement.verified", actor: "Review team", detail: "৳150,000 hospital deposit receipt verified.", createdAt: daysAgo(6) },
  );

  db.reports.push({
    id: "rpt-1",
    campaignId: "cmp-rashid",
    reporterId: "usr-donor-1",
    category: "wrong_payment_account",
    detail: "The account shared in a recent social post is different from the verified account shown here.",
    status: "open",
    submittedAt: daysAgo(1),
  });

  db.notifications.push(
    { id: "ntf-1", userId: "usr-donor-1", title: "Your gift was verified", body: "Your ৳5,000 bKash gift to “Help Ayesha get the heart surgery she needs” is now part of the public record.", href: "/receipts/clm-approved-1", createdAt: daysAgo(2) },
    { id: "ntf-2", userId: "usr-fundraiser-1", title: "New payment to confirm", body: "A ৳1,000 bKash claim is waiting for you to check against your statement.", href: "/dashboard", createdAt: daysAgo(0.2) },
  );
}

/** Deterministic approved gifts so seeded campaign totals are derived from records, like real ones. */
function historicalGifts(
  campaignId: string,
  prefix: string,
  total: number,
  count: number,
  spanDays: number,
  provider: DonationClaim["provider"],
  now: number,
): DonationClaim[] {
  const weights = [0.4, 0.8, 1, 1.2, 1.6, 1];
  const base = total / count;
  const gifts: DonationClaim[] = [];
  let running = 0;
  for (let index = 0; index < count; index += 1) {
    const amount = index === count - 1
      ? total - running
      : Math.max(100, Math.round((base * weights[index % weights.length]) / 50) * 50);
    running += amount;
    // Spread across the campaign's life, ending a day ago so every approval is in the past.
    const submitted = now - spanDays * DAY + (index / count) * (spanDays - 1) * DAY;
    const lastFour = String(1000 + ((index * 7919) % 9000)).slice(-4);
    gifts.push({
      id: `clm-seed-${prefix.toLowerCase()}-${index}`,
      campaignId,
      submitterId: "usr-community",
      donorAlias: `Anonymous #${lastFour}`,
      amount,
      provider,
      transactionId: `SEED${prefix}${String(index).padStart(5, "0")}`,
      senderLastFour: lastFour,
      paidAt: new Date(submitted - 2 * 60 * 60_000).toISOString(),
      evidenceName: "historical-record",
      status: "approved",
      riskScore: 0,
      riskFlags: [],
      fundraiserResponse: "confirmed",
      adminNote: "Provider reference and recipient statement matched.",
      reviewedAt: new Date(submitted + 6 * 60 * 60_000).toISOString(),
      submittedAt: new Date(submitted).toISOString(),
    });
  }
  return gifts;
}
