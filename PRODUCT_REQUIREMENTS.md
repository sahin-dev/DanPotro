# Shohay product and trust requirements

## Product objective

Shohay is a public accountability record for charitable appeals in Bangladesh. In phase one, money moves outside the platform through a fundraiser's verified bKash, Nagad, Rocket, or bank account. Shohay records and reviews claims about those payments. In phase two, verified beneficiaries may receive money through integrated payment providers.

The platform must answer two different questions:

1. Did the donor's payment reach the listed fundraiser account?
2. Did the fundraiser deliver the collected money to the beneficiary or intended service provider?

Approving the first event does not prove the second. The public experience must show both totals separately when beneficiary disbursement is introduced.

## Roles and permissions

### Visitor

- Browse only active or completed campaigns.
- See approved totals, anonymous gift records, verification badges, milestones, and corrections.
- Never see donor identity, sender account, full transaction reference, or raw evidence.

### Donor / evidence submitter

- Record an off-platform payment using a verified destination.
- See the full status and review notes for their own submissions.
- Appeal a rejection or identity restriction.
- Cannot change evidence after review begins; corrections create a new version and audit event.

### Fundraiser / influencer

- Pass identity and payout-account verification.
- Submit a campaign and prove authority or consent to tell the beneficiary's story.
- Confirm or dispute incoming claims against provider statements.
- Publish disbursement milestones and evidence showing funds reached the beneficiary/provider.
- Cannot make the final approval decision for a donation claim.

### Reviewer / admin

- Access evidence only for assigned reviews.
- Approve, reject, request more information, or escalate.
- Give a reason for every decision and select a demerit severity for intentional abuse.
- Cannot silently edit the public total; totals are derived from approved records.

### Auditor / trust lead (production requirement)

- Review admin actions, conflicts of interest, appeals, and high-risk cases.
- Cannot submit or fundraise on cases they audit.

## Core state machines

### Campaign

`draft → under_review → active → funded → closed`

Possible side paths: `changes_requested`, `suspended`, `rejected`, and `appealed`.

Activation requires fundraiser KYC, beneficiary consent/relationship proof, supporting evidence, a reasonable budget, and at least one verified payment destination.

### Donation claim

`draft → pending_fundraiser → pending_admin → approved`

Possible side paths: `flagged`, `more_info_requested`, `rejected`, `appealed`, `reversed`.

An approved record must be reversible without deletion. A reversal adds a new audit event and subtracts the amount from derived totals.

### Beneficiary disbursement

`planned → evidence_submitted → beneficiary_confirmed → admin_verified`

The public campaign eventually needs three numbers: gross approved gifts, fees/refunds, and verified amount delivered.

## Evidence and anti-fraud controls

### Implemented in this MVP

- Duplicate transaction-ID detection across the in-memory dataset.
- Transaction format, sender digits, amount, timestamp, and attachment-presence checks.
- Enhanced review for high-value or old payments.
- Fundraiser confirmation or dispute before final admin review.
- Written admin decision notes and append-only audit events.
- Severity-based demerits and a submission block at 10 points.
- Public masking of transaction references and anonymous donor aliases.
- A confidential campaign-reporting queue with reasoned admin resolution.
- Donor appeals that can reopen a claim and remove points from an overturned decision.
- Separate public amounts for verified donations received and verified funds delivered onward.
- Signed sessions, page guards, route-level role checks, fundraiser ownership checks, and role-filtered dashboard responses.

### Required before production

- Real authentication, verified email/phone, secure sessions, MFA for admins, and role-based authorization on every API route.
- Fundraiser KYC and sanctions/abuse checks appropriate to local law and provider policy.
- Beneficiary consent, guardian consent for minors, and controls against exposing medical or identity details.
- Encrypted object storage; short-lived signed URLs; malware, image, and PDF scanning; access logs; and evidence-retention/deletion policy.
- Cryptographic file hashes and perceptual-image hashes to detect the same or edited screenshot across submissions.
- Provider API/webhook reconciliation for transaction ID, amount, time, destination, and reversal status.
- Rate limits, device/account reputation, bot protection, velocity rules, and linked-account detection.
- Dual review for high-value or conflicted cases; reviewer assignment and separation of duties.
- Beneficiary callback or provider confirmation independent of the fundraiser.
- Appeal workflow, temporary restrictions, point expiry, and human review before permanent blocking.
- Abuse reporting for campaigns and fundraiser conduct, not only donor evidence.
- Immutable correction/reversal events instead of destructive edits.
- Notifications with privacy-safe wording and documented review service levels.

## Demerit policy

Demerits should penalize intent and repeated abuse, not ordinary mistakes.

| Event | Suggested points |
| --- | ---: |
| Missing detail or honest mismatch | 0–1 |
| Repeated unsupported claim | 2 |
| Reused evidence or material misrepresentation | 3 |
| Forged evidence or coordinated fraud | 5 |

At 10 active points, new submissions are paused. A production system should allow appeal, show point reasons and expiry, and let admins remove points only through an audited resolution.

## Privacy model

“Anonymous” means anonymous to the public, not untraceable to the platform. The platform should collect the minimum information needed for review, separate identity data from campaign content, encrypt sensitive data, restrict access by purpose, and delete evidence according to a published retention schedule.

Public gift records should expose only amount, provider, approval date, an anonymous alias, and a masked reference. Campaign stories must avoid full addresses, unneeded diagnoses, phone numbers, identity documents, and images without consent.

## Phase-two payment processing gaps

Direct bKash, Nagad, cards, and SSLCOMMERZ payments materially change the product. Before implementation, define:

- Merchant/platform legal structure and payment-provider approval.
- Custody model: direct-to-beneficiary, split settlement, or platform-held balance.
- Fees, refunds, chargebacks, failed payouts, abandoned campaigns, and surplus funds.
- Reconciliation ledger, idempotent webhooks, signature verification, and settlement reporting.
- AML/KYC responsibilities, transaction limits, tax/accounting treatment, and dispute handling.
- Whether donors receive receipts and whether those receipts have any legal or tax status.

Do not represent phase-one records as processed or guaranteed by Shohay.

## Definition of trustworthy for launch

- Public totals are derived only from immutable approved events.
- No fundraiser can approve their own claim or disbursement.
- Every sensitive-data access and decision is logged.
- Beneficiaries can privately confirm or dispute campaign claims.
- Corrections and reversals remain visible in the audit history.
- Users can appeal restrictions and understand why a decision was made.
- Privacy, retention, terms, prohibited-use, and incident-response policies are published.
