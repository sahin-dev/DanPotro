import { beforeEach, describe, expect, it } from "vitest";

import * as db from "@/lib/db";
import { maskReference } from "@/lib/risk";
import type { User } from "@/lib/types";

const donor = () => db.getUserById("usr-donor-1") as User;
const fundraiser = () => db.getUserById("usr-fundraiser-1") as User;

let counter = 0;
function submitGift(amount = 1_000, campaignId = "cmp-ayesha") {
  counter += 1;
  return db.createClaim(
    {
      campaignId,
      amount,
      provider: "bKash",
      transactionId: `TESTTX${String(counter).padStart(6, "0")}`,
      senderLastFour: "4821",
      paidAt: new Date(Date.now() - 60_000).toISOString(),
      evidenceName: "receipt.png",
    },
    donor(),
  );
}

beforeEach(() => db.resetDatabase());

describe("donation claim lifecycle", () => {
  it("only adds to the public total after fundraiser confirmation and reviewer approval", () => {
    const before = db.getCampaignById("cmp-ayesha")!.verifiedAmount;
    const claim = submitGift(1_500);
    expect(claim.status).toBe("pending_fundraiser");
    expect(() => db.reviewClaim(claim.id, "approved", "ok")).toThrow(/Wait for the fundraiser/);

    db.respondToClaim(claim.id, "confirmed", "In my statement", "usr-fundraiser-1");
    expect(db.getCampaignById("cmp-ayesha")!.verifiedAmount).toBe(before);

    db.reviewClaim(claim.id, "approved", "Matched");
    const after = db.getCampaignById("cmp-ayesha")!;
    expect(after.verifiedAmount).toBe(before + 1_500);
    expect(db.getPublicDonations("cmp-ayesha")[0]).toMatchObject({ id: claim.id, reference: maskReference(claim.transactionId) });
  });

  it("stops a fundraiser from reconciling another fundraiser's campaign", () => {
    const claim = submitGift(1_000, "cmp-rashid");
    expect(() => db.respondToClaim(claim.id, "confirmed", "", "usr-fundraiser-1")).toThrow(/own campaign/);
  });

  it("flags duplicate transaction references automatically", () => {
    const first = submitGift();
    const duplicate = db.createClaim({ ...first, transactionId: first.transactionId.toLowerCase() }, donor());
    expect(duplicate.status).toBe("flagged");
    expect(duplicate.riskFlags).toContain("Transaction ID already used");
  });

  it("rejects claims to unverified providers and non-active campaigns", () => {
    expect(() => db.createClaim({ ...submitGift(), provider: "Rocket", transactionId: "ROCKET0001" }, donor())).toThrow(/verified payment destinations/);
    expect(() => db.createClaim({ ...submitGift(), campaignId: "cmp-students", transactionId: "FUNDED0001" }, donor())).toThrow(/not accepting/);
  });

  it("routes a reviewer question back to the donor and returns to review after an answer", () => {
    const claim = submitGift();
    db.respondToClaim(claim.id, "confirmed", "", "usr-fundraiser-1");
    db.reviewClaim(claim.id, "more_info", "Please share the exact time.");
    expect(claim.status).toBe("more_info_requested");
    expect(() => db.respondToInfoRequest(claim.id, "It was 3:15pm", "usr-fundraiser-1")).toThrow(/not found/i);
    db.respondToInfoRequest(claim.id, "It was 3:15pm from my own account.", "usr-donor-1");
    expect(claim.status).toBe("pending_admin");
  });

  it("reverses an approval without deleting it and reopens a funded campaign", () => {
    const campaign = db.getCampaignById("cmp-ayesha")!;
    const claim = submitGift(campaign.goalAmount - campaign.verifiedAmount);
    db.respondToClaim(claim.id, "confirmed", "", "usr-fundraiser-1");
    db.reviewClaim(claim.id, "approved", "Matched");
    expect(db.getCampaignById("cmp-ayesha")!.status).toBe("funded");

    db.reverseClaim(claim.id, "Provider reported a chargeback.");
    const reopened = db.getCampaignById("cmp-ayesha")!;
    expect(reopened.status).toBe("active");
    expect(reopened.verifiedAmount).toBe(campaign.verifiedAmount);
    expect(db.getDashboardForUser("usr-admin-1", "admin").claims.find((entry) => entry.id === claim.id)?.status).toBe("reversed");
  });

  it("restores demerits when an appeal is upheld", () => {
    const claim = submitGift();
    const startingPoints = donor().demeritPoints;
    db.reviewClaim(claim.id, "rejected", "Could not match", 3);
    expect(donor().demeritPoints).toBe(startingPoints + 3);

    const appeal = db.createClaimAppeal(claim.id, "I have the provider SMS that proves this payment.", "usr-donor-1");
    db.reviewClaimAppeal(appeal.id, "upheld", "SMS matches provider format.");
    expect(donor().demeritPoints).toBe(startingPoints);
    expect(claim.status).toBe("pending_fundraiser");
  });

  it("blocks submissions at the demerit threshold", () => {
    donor().demeritPoints = db.DEMERIT_BLOCK_THRESHOLD;
    expect(() => submitGift()).toThrow(/paused/);
  });
});

describe("campaign review loop", () => {
  it("keeps new campaigns private until a verified payment account exists and a reviewer activates it", () => {
    const campaign = db.createCampaign(
      { title: "Clean water filters for a village school", summary: "Water filters for 300 students who currently drink untreated water.", story: "x".repeat(100), category: "Education", location: "Khulna, Bangladesh", goalAmount: 50_000, beneficiaryName: "Village school", beneficiaryRelationship: "Teacher" },
      fundraiser(),
    );
    expect(db.getPublicCampaigns().some((entry) => entry.id === campaign.id)).toBe(false);
    expect(() => db.reviewCampaign(campaign.id, "activate", "Looks good")).toThrow(/payment destination/);

    const method = db.addPaymentMethod(campaign.id, { provider: "bKash", accountNumber: "01711 000 111", accountName: "Rafiq Hasan", type: "Personal" }, "usr-fundraiser-1");
    expect(db.toPublicCampaign(db.getCampaignById(campaign.id)!).paymentMethods).toHaveLength(0);
    db.reviewPaymentMethod(campaign.id, method.id, "verified", "Name matches NID");
    db.reviewCampaign(campaign.id, "activate", "Documents and consent verified");

    const live = db.getPublicCampaigns().find((entry) => entry.id === campaign.id);
    expect(live?.status).toBe("active");
    expect(live?.paymentMethods).toHaveLength(1);
  });

  it("lets a fundraiser edit and resubmit after changes are requested", () => {
    db.reviewCampaign("cmp-sylhet-food", "request_changes", "Add the supplier quotation.");
    const record = db.getCampaignById("cmp-sylhet-food")!;
    db.editCampaign(record.id, { ...record, summary: `${record.summary} Supplier quotation attached.` }, "usr-fundraiser-1");
    expect(db.getCampaignById(record.id)!.status).toBe("under_review");
    expect(() => db.editCampaign("cmp-ayesha", record, "usr-fundraiser-1")).toThrow(/cannot be edited/);
  });

  it("only counts verified disbursements and caps them at verified gifts", () => {
    const before = db.getCampaignById("cmp-ayesha")!;
    expect(() => db.createDisbursement("cmp-ayesha", { amount: before.verifiedAmount, recipient: "Hospital", description: "Too much money" , evidenceName: "r.pdf" }, "usr-fundraiser-1")).toThrow(/Only/);

    const entry = db.createDisbursement("cmp-ayesha", { amount: 20_000, recipient: "Pharmacy", description: "Post-operative medicine", evidenceName: "r.pdf" }, "usr-fundraiser-1");
    expect(db.getCampaignById("cmp-ayesha")!.verifiedDisbursedAmount).toBe(before.verifiedDisbursedAmount);
    db.reviewDisbursement(entry.id, "verified", "Pharmacy invoice matched");
    const after = db.getCampaignById("cmp-ayesha")!;
    expect(after.verifiedDisbursedAmount).toBe(before.verifiedDisbursedAmount + 20_000);
    expect(after.updates[0].type).toBe("transfer");
  });
});

describe("privacy boundaries", () => {
  it("never exposes donor identity or evidence to fundraisers", () => {
    const snapshot = db.getDashboardForUser("usr-fundraiser-1", "fundraiser");
    expect(snapshot.claims.length).toBeGreaterThan(0);
    for (const claim of snapshot.claims) {
      expect(claim.submitterId).toBe("");
      expect(claim.evidenceFileId).toBeUndefined();
      expect(claim.evidenceName).toMatch(/Private/);
    }
    expect(snapshot.campaigns.every((campaign) => campaign.fundraiserId === "usr-fundraiser-1")).toBe(true);
  });

  it("never includes password hashes in dashboard users", () => {
    const users = db.getDashboardForUser("usr-admin-1", "admin").users;
    for (const user of users) expect(user).not.toHaveProperty("passwordHash");
  });

  it("only lets the owner open a receipt for an approved gift", () => {
    expect(db.getReceipt("clm-approved-1", "usr-donor-1")?.amount).toBe(5_000);
    expect(db.getReceipt("clm-approved-1", "usr-fundraiser-1")).toBeUndefined();
    expect(db.getReceipt("clm-pending-1", "usr-donor-1")).toBeUndefined();
  });

  it("notifies the donor when a gift is approved", () => {
    const claim = submitGift();
    db.respondToClaim(claim.id, "confirmed", "", "usr-fundraiser-1");
    const unread = db.getUnreadCount("usr-donor-1");
    db.reviewClaim(claim.id, "approved", "Matched");
    expect(db.getUnreadCount("usr-donor-1")).toBe(unread + 1);
    expect(db.getNotifications("usr-donor-1")[0].title).toBe("Your gift was verified");
    db.markNotificationsRead("usr-donor-1");
    expect(db.getUnreadCount("usr-donor-1")).toBe(0);
  });
});
