import { z } from "zod";

import { PASSWORD_RULES, isStrongPassword } from "@/lib/password-rules";
import { MAX_CLAIM_AMOUNT } from "@/lib/risk";

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(min, min <= 1 ? `${label} is required.` : `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

const note = (label = "A review note") => text(label, 1, 1_000);

export const emailSchema = z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid email address."));
export const passwordSchema = z.string().refine(isStrongPassword, PASSWORD_RULES);

export const registerSchema = z.object({
  displayName: text("Your name", 2, 60),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["donor", "fundraiser"], { error: "Choose how you will use Shohay." }),
  acceptTerms: z.literal(true, { error: "Please accept the terms to create an account." }),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").max(200),
  password: z.string().min(1, "Password is required.").max(200),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1, "Enter your current password."), newPassword: passwordSchema });
export const profileSchema = z.object({ displayName: text("Display name", 2, 60) });

export const campaignCategories = ["Medical", "Emergency", "Education", "Food support"] as const;

export const campaignSchema = z.object({
  title: text("Cause title", 12, 120),
  summary: text("Summary", 30, 300),
  story: text("Story", 80, 6_000),
  category: z.enum(campaignCategories, { error: "Choose a category." }),
  location: text("Location", 3, 80),
  goalAmount: z.coerce
    .number({ error: "Enter a goal amount." })
    .int("Use a whole taka amount.")
    .min(1_000, "The funding goal must be at least ৳1,000.")
    .max(10_000_000, "The funding goal must be at most ৳10,000,000."),
  beneficiaryName: text("Beneficiary name", 2, 120),
  beneficiaryRelationship: text("Your relationship", 2, 160),
});

export const campaignReviewSchema = z.object({
  decision: z.enum(["activate", "request_changes", "reject", "suspend", "reinstate", "close"], { error: "Choose a decision." }),
  note: note(),
});

export const paymentMethodSchema = z.object({
  provider: z.enum(["bKash", "Nagad", "Rocket", "Bank"], { error: "Choose a provider." }),
  accountNumber: z.string().trim().regex(/^[0-9 -]{6,30}$/, "Enter a valid account number."),
  accountName: text("Account holder name", 2, 80),
  type: z.enum(["Personal", "Merchant", "Bank account"], { error: "Choose an account type." }),
});

export const verificationSchema = z.object({
  decision: z.enum(["verified", "rejected"], { error: "Choose a decision." }),
  note: note(),
});

export const campaignUpdateSchema = z.object({
  title: text("Update title", 4, 120),
  body: text("Update", 10, 2_000),
  type: z.enum(["update", "milestone"]).default("update"),
});

export const disbursementSchema = z.object({
  amount: z.coerce.number({ error: "Enter an amount." }).int("Use a whole taka amount.").positive("Enter an amount greater than zero."),
  recipient: text("Recipient", 2, 120),
  description: text("Description", 10, 500),
});

export const claimSchema = z.object({
  campaignId: z.string().min(1, "Choose a campaign."),
  provider: z.enum(["bKash", "Nagad", "Rocket", "Bank"], { error: "Choose the payment method you used." }),
  amount: z.coerce
    .number({ error: "Enter a valid donation amount." })
    .int("Use a whole taka amount.")
    .positive("Enter a valid donation amount.")
    .max(MAX_CLAIM_AMOUNT, "Payments above ৳500,000 must be recorded with the review team directly."),
  transactionId: z.string().trim().toUpperCase().min(6, "Enter the full transaction ID.").max(40, "That transaction ID is too long."),
  senderLastFour: z.string().regex(/^\d{4}$/, "Enter the last four digits of the sender account."),
  paidAt: z.string().refine((value) => Number.isFinite(new Date(value).getTime()), "Enter the payment date and time."),
  note: z.string().trim().max(1_000).optional(),
});

export const respondSchema = z.object({
  response: z.enum(["confirmed", "disputed"], { error: "Choose confirm or dispute." }),
  note: z.string().trim().max(1_000).default(""),
});

export const claimReviewSchema = z.object({
  decision: z.enum(["approved", "rejected", "more_info"], { error: "Choose approve, reject, or request information." }),
  note: note("A review note is required for the audit trail."),
  demerits: z.coerce.number().int().min(0).max(5).default(0),
});

export const infoResponseSchema = z.object({ response: text("Your answer", 10, 2_000) });
export const reversalSchema = z.object({ note: text("A reversal reason", 10, 1_000) });
export const appealSchema = z.object({ reason: text("Your appeal", 20, 2_000) });
export const appealReviewSchema = z.object({ decision: z.enum(["upheld", "denied"]), note: note() });

export const reportSchema = z.object({
  campaignId: z.string().min(1),
  category: z.enum(["false_story", "wrong_payment_account", "privacy", "fund_misuse", "other"], { error: "Choose a valid report category." }),
  detail: text("Report detail", 20, 2_000),
});
export const reportReviewSchema = z.object({ status: z.enum(["resolved", "dismissed"]), note: note() });

export const markReadSchema = z.object({ id: z.string().optional() });
