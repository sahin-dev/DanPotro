# Shohay full-project audit

## Executive summary

Shohay now functions as a coherent phase-one charity accountability MVP: public campaign discovery, private donation evidence, fundraiser reconciliation, independent review, public approved totals, beneficiary-delivery milestones, demerits, appeals, and confidential campaign reporting.

The most important issue found in this audit was that the original dashboard role switcher was presentation-only. The browser received the complete admin dataset and the APIs did not authenticate callers. This is now replaced by signed sessions, server-side page guards, route-level role checks, ownership checks, and role-specific data transfer objects.

## Architecture reviewed

- Next.js App Router pages and layouts
- Route-handler backend under `src/app/api`
- In-memory repository and risk rules under `src/lib`
- Public campaign, evidence-submission, campaign-application, and dashboard interfaces
- Donor, fundraiser, reviewer, reporting, demerit, and appeal workflows
- Build, lint, production dependency audit, and authenticated API behavior

## Role access model

| Capability | Visitor | Donor | Fundraiser | Reviewer |
| --- | :---: | :---: | :---: | :---: |
| Browse public causes and approved totals | Yes | Yes | Yes | Yes |
| Submit private donation evidence | No | Yes | No | No |
| View a donor's private claims | No | Own only | Reconciliation fields only | Yes |
| Create a campaign | No | No | Yes | No |
| Reconcile an incoming claim | No | No | Own campaigns only | No |
| Approve/reject a claim | No | No | No | Yes |
| Appeal a rejection | No | Own only | No | No |
| Submit a campaign safety report | No | Yes | Yes | Yes |
| Resolve reports and appeals | No | No | No | Yes |
| View the complete audit/review dataset | No | No | No | Yes |

## Security changes completed

1. Signed seven-day JWT sessions stored in `HttpOnly`, `SameSite=Lax` cookies.
2. Server-side credential validation for three development accounts.
3. Current user and role rechecked against the data store on each session read.
4. Page guards for dashboards and fundraiser campaign creation.
5. Authentication and role authorization on every private route handler.
6. Ownership enforcement prevents one fundraiser from reconciling another fundraiser's campaign.
7. Role-filtered dashboard DTOs prevent private admin data from reaching donor or fundraiser browsers.
8. Fundraiser evidence metadata is redacted; raw evidence remains reviewer-only.
9. Donors can access only their own claims, appeals, reports, and account record.
10. Admin approval still requires prior fundraiser confirmation.

## UI and usability changes completed

- Added a dedicated two-panel sign-in experience with clear role descriptions and demo-account shortcuts.
- Replaced the unsafe role switcher with a server-verified identity and role badge.
- Added authenticated navigation, contextual calls to action, and sign-out on desktop and mobile.
- Redesigned dashboard metrics and copy for each role instead of showing irrelevant admin statistics to everyone.
- Added friendly restricted-access and signed-out states.
- Kept public payment destinations visible while requiring a donor account to submit evidence.
- Added clear role-specific explanations around evidence visibility and private reporting.
- Preserved responsive layouts, keyboard-accessible controls, labels, focus states, and status feedback.

## Data and workflow findings

### Strong foundations

- Public totals are derived only from approved claims.
- Duplicate transaction references and other risk signals are checked before review.
- Fundraiser confirmation and reviewer approval are separate decisions.
- Demerits have severity and an appeal mechanism.
- Reports, decisions, and reversals create audit events instead of silently overwriting history.
- Collected and delivered amounts are presented separately.

### Remaining production work

The following are intentionally outside this in-memory MVP and must be completed before accepting real user data or money:

1. Replace demo authentication with a managed identity provider, verified email/phone, password reset, admin MFA, session revocation, and login rate limits.
2. Replace the in-memory repository with a transactional database and immutable ledger tables.
3. Use encrypted private object storage, signed evidence URLs, malware scanning, file hashing, retention rules, and access logs.
4. Add CSRF/origin validation, API rate limits, device/velocity abuse controls, and security monitoring.
5. Add KYC, beneficiary consent, guardian rules for minors, reviewer conflicts, and dual approval for high-value cases.
6. Add notifications, requests for more information, appeal service levels, and reviewer assignment.
7. Add provider reconciliation or signed webhooks before claiming direct bKash, Nagad, bank, or SSLCOMMERZ verification.
8. Add tests for persistence, concurrent approvals, reversals, refunds, duplicate webhook delivery, and multi-instance deployment.
9. Configure `SESSION_SECRET` in every deployed environment; the development fallback is process-local and intentionally invalidates sessions on restart.

## Recommended next implementation order

1. PostgreSQL schema and migrations with claims, decisions, demerits, appeals, reports, and immutable audit events.
2. Managed authentication plus database-backed sessions and admin MFA.
3. Encrypted evidence upload pipeline.
4. Provider reconciliation and beneficiary-disbursement ledger.
5. Automated unit, integration, and browser tests in CI.
6. Notifications, localization in Bangla, accessibility audit, and analytics that exclude sensitive data.

## Production hardening pass (October 2026)

### Defects fixed

- **Private campaigns were public.** `getCampaigns()` returned campaigns still under review, including beneficiary names and unverified payment accounts, on the homepage, `/campaigns`, the campaign page, and `GET /api/campaigns`. Visitors now see only active, funded, or closed campaigns, and unverified accounts and document references are stripped.
- **Public totals were editable counters.** `verifiedAmount`, `donorCount`, and `verifiedDisbursedAmount` are now derived from approved claims and verified disbursements, so reversals reduce totals without deleting records.
- **No path to activation.** Campaigns stayed `under_review` forever, and nothing could verify a payment account or a disbursement. The full review loop now exists.
- **Evidence was never uploaded.** Only the filename was sent. Files are now uploaded, checked by content signature, hashed for duplicate detection, and viewable by reviewers.
- **Demo-only authentication.** Hard-coded accounts are replaced by stored users with scrypt hashes, self-service registration, password reset, and revocable sessions.
- **Unhandled errors.** Invalid JSON produced 500s, and errors were matched by message text. Routes now use zod validation and typed `AppError`s through `handleApi`.
- **Donation form crash.** The form called `event.currentTarget.reset()` after an `await`, when `currentTarget` is already null.

### Controls added

Per-request CSP nonces, cross-site write rejection, security headers, rate limits, session revocation, role-filtered DTOs without donor IDs or evidence references for fundraisers, error and 404 boundaries, a health check, a Docker image (standalone, non-root), CI, and 32 unit and workflow tests. A 55-check HTTP smoke test was run against a production build covering authorization, privacy, the claim lifecycle, reversals, and session revocation.

### Still required before real money or data

1. Replace the in-memory store with a transactional database (the main blocker; the app must run as a single instance until then).
2. Encrypted object storage with malware scanning and a retention job for evidence.
3. Admin MFA, email verification, and reviewer separation of duties (an appeal reviewer different from the original reviewer; dual review for high-value claims).
4. Shared rate-limit store, bot protection, and monitoring and alerting.
5. Fundraiser KYC and beneficiary or guardian consent capture, plus Bangla localization.
6. Legal review of the privacy policy and terms pages.
