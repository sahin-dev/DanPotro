import "server-only";

import { env } from "@/lib/env";

interface Email {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends through Resend when RESEND_API_KEY and EMAIL_FROM are set. Without a provider, development
 * prints the message to the server console so flows like password reset can still be tested.
 */
export async function sendEmail(email: Email) {
  if (env.resendApiKey && env.emailFrom) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: email.to, subject: email.subject, text: email.text }),
    });
    if (!response.ok) console.error(`[mail] Delivery failed with status ${response.status}`);
    return;
  }
  if (env.isProduction) {
    console.warn("[mail] No email provider configured; a message was not delivered.");
    return;
  }
  console.info(`\n[mail] To: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n`);
}
