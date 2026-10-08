# Shohay

Shohay is a trust-focused charity record for Bangladesh, built with Next.js 16. Donors pay fundraisers directly (bKash, Nagad, Rocket, bank) and record the payment privately. The fundraiser confirms or disputes it, an independent reviewer decides, and only approved gifts enter the public total. Fundraisers then prove delivery to the beneficiary with receipts.

## Features

**For donors**
- Self-service accounts with strong password rules, password reset, password change, and "sign out other devices".
- Private evidence upload (PNG, JPG, WebP, PDF up to 5 MB), validated by file content and hashed to detect reused screenshots.
- A dashboard that tracks every record, answers reviewer questions, and appeals rejections.
- Printable verified-gift records for approved gifts.
- An in-app notification inbox for every status change, plus updates and delivery news from causes they supported.

**For fundraisers**
- Campaign applications with private supporting documents.
- Payment accounts that stay hidden until a reviewer verifies them.
- Edit and resubmit after a change request.
- Reconciliation of incoming claims against their statement, with notes.
- Public updates and milestones (supporters are notified).
- Delivery (disbursement) records with receipts. Verified deliveries appear publicly as "verified delivered onward".

**For reviewers**
- Tabbed queues for evidence, campaign applications and payment accounts, deliveries, safety reports and appeals, approved gifts, and the audit trail.
- Approve, reject with severity-based demerits, or ask the donor for more information.
- Reverse an approved gift without deleting it; public totals drop automatically.
- Activate, request changes on, reject, suspend, reinstate, or close campaigns, with a written note for every decision.

**For everyone**
- Campaign search with category filter, sorting (ending soonest, closest to goal, newest, most supported), and URLs you can share.
- Share buttons (copy link, WhatsApp, Facebook, native share), plus generated Open Graph images for each cause.
- Separate public totals for verified gifts and verified delivery, both derived from records rather than editable counters.

## Run locally

```bash
npm install
cp .env.example .env.local   # optional in development
npm run dev
```

Open <http://localhost:3000>. Development seeds demo data and three demo accounts (password `demo1234`):

| Role | Email |
| --- | --- |
| Donor | `donor@shohay.demo` |
| Fundraiser | `fundraiser@shohay.demo` |
| Reviewer | `admin@shohay.demo` |

Password-reset emails are printed to the server console unless `RESEND_API_KEY` and `EMAIL_FROM` are set.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Vitest unit and workflow tests |
| `npm run check` | Lint, typecheck, and tests together |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests, build, and a production dependency audit on every push and pull request.

## Configuration

See [.env.example](./.env.example) for every variable.

| Variable | Required | Notes |
| --- | --- | --- |
| `SESSION_SECRET` | Production | At least 32 characters. The server refuses to sign sessions without it. |
| `NEXT_PUBLIC_SITE_URL` | Production | Public origin, set at **build** time. An `https://` value enables HSTS and `upgrade-insecure-requests`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First deploy | Creates the first reviewer account at startup. |
| `SEED_DEMO_DATA` | No | Defaults to `true` outside production and `false` in production. |
| `EVIDENCE_DIR` | No | Private upload directory, which must be on a persistent volume. Defaults to `.data/evidence`. |
| `RESEND_API_KEY`, `EMAIL_FROM` | For email | Without them, production cannot send password-reset emails. |

## Deploy

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://shohay.example -t shohay .
docker run -p 3000:3000 -v shohay-data:/data \
  -e SESSION_SECRET="$(openssl rand -base64 48)" \
  -e ADMIN_EMAIL=reviews@shohay.example -e ADMIN_PASSWORD='…' \
  shohay
```

The image uses Next.js standalone output, runs as a non-root user, stores evidence under `/data`, and has a health check at `GET /api/health`.

> **Run exactly one instance.** The data store is in memory: records reset when the process restarts and are not shared between replicas. See [Data layer](#data-layer).

## Security model

- **Sessions:** HS256 JWTs in `HttpOnly`, `SameSite=Lax`, `Secure` (production) cookies. Each session carries a version number, so a password change or "sign out other devices" revokes every other session immediately.
- **Passwords:** scrypt with a per-user salt. Login takes the same time whether or not the email exists, and the forgot-password response never reveals whether an account exists.
- **Authorization:** every API route checks the role on the server, and fundraisers can act only on their own campaigns. Role-filtered dashboard data means fundraisers never receive donor IDs, notes, or evidence file IDs.
- **Request protection:** `src/proxy.ts` rejects cross-site `POST/PUT/PATCH/DELETE` requests to `/api/*` and sets a per-request nonce-based Content-Security-Policy. `next.config.ts` adds `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, and HSTS when served over HTTPS.
- **Rate limits:** login (per IP and per email), registration, password reset, claim submission, reports, and campaign creation.
- **Input validation:** zod schemas for every request body ([src/lib/validation.ts](./src/lib/validation.ts)). Errors return consistent JSON through `handleApi`, and unexpected errors are logged without leaking details.
- **Evidence:** stored outside `public/`, accepted by checking the file's content signature (not its extension), downloadable only by reviewers and the uploader, and served with a sandboxing CSP.
- **Privacy:** private campaigns (in review, changes requested, rejected, suspended) return 404 to the public. Unverified payment accounts and documents are never sent to visitors.

## Data layer

All persistence goes through [src/lib/db.ts](./src/lib/db.ts) (seeded by [src/lib/seed.ts](./src/lib/seed.ts)). [src/lib/storage.ts](./src/lib/storage.ts) handles files, and [src/lib/rate-limit.ts](./src/lib/rate-limit.ts) handles rate limits. Routes and pages never touch the store directly, so these modules are the only things to replace when moving to:

1. PostgreSQL (or similar) with transactions and append-only ledger tables for claims, decisions, and disbursements.
2. Encrypted object storage (S3, R2, GCS) with signed URLs and malware scanning.
3. A shared rate-limit store such as Redis.

## API

| Route | Who | Purpose |
| --- | --- | --- |
| `POST /api/auth/register` · `login` · `logout` | Anyone | Accounts and sessions |
| `POST /api/auth/forgot-password` · `reset-password` | Anyone | Password recovery |
| `PATCH /api/account` · `POST /api/account/password` · `DELETE /api/account/sessions` | Signed in | Profile, password, revoke other sessions |
| `GET/POST /api/notifications` | Signed in | Inbox and mark-as-read |
| `GET /api/campaigns` · `GET /api/campaigns/:id` | Anyone | Public campaigns (owners and reviewers also see private ones) |
| `POST /api/campaigns` · `PATCH /api/campaigns/:id` | Fundraiser | Apply (multipart with documents), then edit or resubmit |
| `POST /api/campaigns/:id/payment-methods` · `updates` · `disbursements` | Owner | Add an account, post an update, record a delivery |
| `POST /api/campaigns/:id/review` · `…/payment-methods/:methodId/review` · `/api/disbursements/:id/review` | Reviewer | Campaign, account, and delivery decisions |
| `POST /api/donations` | Donor | Record a gift (multipart with evidence) |
| `POST /api/donations/:id/respond` | Owner fundraiser | Confirm or dispute |
| `POST /api/donations/:id/review` · `reverse` | Reviewer | Approve, reject, ask for info, or reverse |
| `POST /api/donations/:id/info` · `appeal` | Donor | Answer a question or appeal a rejection |
| `POST /api/reports` · `/api/reports/:id/review` · `/api/appeals/:id/review` | Signed in / Reviewer | Safety reports and appeals |
| `GET /api/files/:id` | Reviewer or uploader | Private evidence download |
| `GET /api/dashboard` · `GET /api/health` | Signed in · Anyone | Role-filtered snapshot · health check |

Read [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md) for the threat model and phase-two payment gaps, and [PROJECT_AUDIT.md](./PROJECT_AUDIT.md) for the access-control matrix and the remaining production work.
