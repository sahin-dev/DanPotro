import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Terms of use", description: "The rules for recording gifts and running campaigns on Shohay." };

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms of use"
      updated="3 October 2026"
      sections={[
        { heading: "What Shohay is", body: <p>Shohay is a public record of charitable appeals. Donors pay fundraisers directly through bKash, Nagad, Rocket, or a bank. Shohay does not process, hold, or guarantee any payment, and an approved record is not a tax or legal receipt.</p> },
        { heading: "Honest evidence", body: <p>Only record payments you actually made, with your own unedited evidence. Reusing, editing, or inventing evidence can lead to demerit points, paused submissions, and referral to the relevant authorities. Every rejection includes a reason and can be appealed.</p> },
        { heading: "Fundraiser responsibilities", body: <><p>Fundraisers must have the beneficiary’s consent (or a guardian’s, for minors), describe needs truthfully, list only accounts they control, confirm or dispute claims honestly, and publish evidence when funds are delivered.</p><p>Do not publish phone numbers, full addresses, identity documents, or unnecessary medical details.</p></> },
        { heading: "Reviews and enforcement", body: <p>Reviewers may request changes, decline, suspend, or close campaigns and may reverse approved records when new evidence shows they were invalid. Reversals stay visible in the audit history.</p> },
        { heading: "Reporting concerns", body: <p>Use “Report a concern privately” on any campaign page, or email <a className="font-bold text-forest underline" href="mailto:support@shohay.org">support@shohay.org</a>. For emergencies, contact local authorities.</p> },
      ]}
    />
  );
}
