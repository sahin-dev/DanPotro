import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Privacy policy", description: "What Shohay collects, who can see it, and how long it is kept." };

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy policy"
      updated="3 October 2026"
      sections={[
        { heading: "Anonymous to the public, not to reviewers", body: <p>Public pages show only approved amounts, the payment provider, an anonymous alias, a masked transaction reference, and the approval date. Your name, email, phone number, sender account, and screenshots are never published.</p> },
        { heading: "What we collect", body: <><p>Account details (name, email, hashed password), the payment details you record (amount, provider, transaction ID, last four sender digits, time), and the evidence files you upload.</p><p>Fundraisers additionally provide identity, beneficiary, and supporting documents, and the payment accounts listed on their campaigns.</p></> },
        { heading: "Who can see what", body: <p>Donors see their own records. Fundraisers see the reconciliation details needed to check their statements, but never donor identities or screenshots. Only authorised reviewers can open evidence files, and only to decide a review, report, or appeal. Every decision is recorded in an audit trail.</p> },
        { heading: "Retention", body: <p>Evidence files are kept only as long as needed to review a claim and handle appeals and disputes, then deleted according to our retention schedule. Approved public records are kept so the campaign history remains accurate.</p> },
        { heading: "Your choices", body: <p>You can change your display name and password, sign out other devices from account settings, and contact <a className="font-bold text-forest underline" href="mailto:support@shohay.org">support@shohay.org</a> to request a copy or deletion of your personal data where the law allows.</p> },
      ]}
    />
  );
}
