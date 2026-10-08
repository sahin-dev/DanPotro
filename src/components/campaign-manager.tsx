"use client";

import { CheckCircle2, CreditCard, FileUp, LoaderCircle, Megaphone, PencilLine, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { apiRequest, errorMessage } from "@/lib/client";
import { formatBDT, formatDate } from "@/lib/format";
import type { Campaign, Disbursement } from "@/lib/types";

type Feedback = { type: "success" | "error"; message: string } | null;

function useSubmit() {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const router = useRouter();
  async function run(task: () => Promise<unknown>, success: string) {
    setLoading(true);
    setFeedback(null);
    try {
      await task();
      setFeedback({ type: "success", message: success });
      router.refresh();
      return true;
    } catch (caught) {
      setFeedback({ type: "error", message: errorMessage(caught) });
      return false;
    } finally {
      setLoading(false);
    }
  }
  return { loading, feedback, run };
}

function Message({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return <p role={feedback.type === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-xs leading-5 ${feedback.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{feedback.message}</p>;
}

function Panel({ id, icon, title, subtitle, children }: { id?: string; icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return <section id={id} className="surface scroll-mt-24 bg-white p-6"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-forest [&>svg]:size-4">{icon}</span><div><h2 className="font-display text-xl font-bold text-forest">{title}</h2><p className="mt-0.5 text-xs text-ink/45">{subtitle}</p></div></div><div className="mt-5">{children}</div></section>;
}

export function CampaignManager({ campaign, disbursements }: { campaign: Campaign; disbursements: Disbursement[] }) {
  const editable = ["under_review", "changes_requested"].includes(campaign.status);
  const isPublic = ["active", "funded", "closed"].includes(campaign.status);
  const committed = disbursements.filter((entry) => entry.status !== "rejected").reduce((sum, entry) => sum + entry.amount, 0);
  const available = Math.max(0, campaign.verifiedAmount - committed);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {editable && <div className="lg:col-span-2"><EditDetails campaign={campaign} /></div>}
      <PaymentMethods campaign={campaign} />
      {isPublic ? <PostUpdate campaign={campaign} /> : <Panel icon={<Megaphone />} title="Public updates" subtitle="Available once your campaign is live."><p className="text-xs leading-5 text-ink/50">After activation you can post milestones and progress updates. Supporters who gave are notified automatically.</p></Panel>}
      {isPublic && <div className="lg:col-span-2"><RecordDisbursement campaign={campaign} available={available} disbursements={disbursements} /></div>}
    </div>
  );
}

function EditDetails({ campaign }: { campaign: Campaign }) {
  const { loading, feedback, run } = useSubmit();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    await run(() => apiRequest(`/api/campaigns/${campaign.id}`, { method: "PATCH", json: form }), campaign.status === "changes_requested" ? "Changes saved and resubmitted for review." : "Details updated.");
  }
  return (
    <Panel icon={<PencilLine />} title={campaign.status === "changes_requested" ? "Update and resubmit" : "Edit details"} subtitle="You can edit your application until it is approved.">
      {campaign.reviewNote && campaign.status === "changes_requested" && <p className="mb-5 rounded-xl bg-orange-50 p-3 text-xs leading-5 text-orange-900"><strong>Reviewer asked:</strong> {campaign.reviewNote}</p>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="title">Cause title</label><input id="title" name="title" className="field" defaultValue={campaign.title} minLength={12} maxLength={120} required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="summary">Short public summary</label><textarea id="summary" name="summary" className="field min-h-20" defaultValue={campaign.summary} minLength={30} maxLength={300} required /></div>
        <div><label className="label" htmlFor="category">Category</label><select id="category" name="category" className="field" defaultValue={campaign.category}><option>Medical</option><option>Emergency</option><option>Education</option><option>Food support</option></select></div>
        <div><label className="label" htmlFor="goalAmount">Goal amount (BDT)</label><input id="goalAmount" name="goalAmount" type="number" min={1000} step={1} className="field" defaultValue={campaign.goalAmount} required /></div>
        <div><label className="label" htmlFor="location">General location</label><input id="location" name="location" className="field" defaultValue={campaign.location} required /></div>
        <div><label className="label" htmlFor="beneficiaryName">Beneficiary name</label><input id="beneficiaryName" name="beneficiaryName" className="field" defaultValue={campaign.beneficiaryName} required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="beneficiaryRelationship">Your relationship</label><input id="beneficiaryRelationship" name="beneficiaryRelationship" className="field" defaultValue={campaign.beneficiaryRelationship} required /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="story">Full public story</label><textarea id="story" name="story" className="field min-h-36" defaultValue={campaign.story} minLength={80} maxLength={6000} required /></div>
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><Message feedback={feedback} /><button className="btn-primary shrink-0" disabled={loading}>{loading && <LoaderCircle size={15} className="animate-spin" />}{campaign.status === "changes_requested" ? "Save and resubmit" : "Save changes"}</button></div>
      </form>
    </Panel>
  );
}

function PaymentMethods({ campaign }: { campaign: Campaign }) {
  const { loading, feedback, run } = useSubmit();
  const canAdd = !["closed", "rejected", "suspended"].includes(campaign.status);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = Object.fromEntries(new FormData(element).entries());
    if (await run(() => apiRequest(`/api/campaigns/${campaign.id}/payment-methods`, { json: form }), "Account added. Reviewers will verify it before donors can see it.")) element.reset();
  }
  return (
    <Panel id="payment" icon={<CreditCard />} title="Payment destinations" subtitle="Donors only see accounts that reviewers have verified.">
      <ul className="space-y-2">
        {campaign.paymentMethods.length ? campaign.paymentMethods.map((method) => <li key={method.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 p-3"><div><p className="text-xs font-bold">{method.provider} · {method.type}</p><p className="font-mono text-sm font-bold text-forest">{method.accountNumber}</p><p className="text-[10px] text-ink/45">{method.accountName}{method.reviewNote ? ` · ${method.reviewNote}` : ""}</p></div><StatusBadge status={method.status} /></li>) : <li className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Add at least one account. Your campaign cannot go live without a verified destination.</li>}
      </ul>
      {canAdd && <form onSubmit={submit} className="mt-5 grid gap-3 border-t border-ink/7 pt-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="provider">Provider</label><select id="provider" name="provider" className="field" defaultValue="bKash"><option>bKash</option><option>Nagad</option><option>Rocket</option><option>Bank</option></select></div>
        <div><label className="label" htmlFor="type">Account type</label><select id="type" name="type" className="field" defaultValue="Personal"><option>Personal</option><option>Merchant</option><option>Bank account</option></select></div>
        <div><label className="label" htmlFor="accountNumber">Account number</label><input id="accountNumber" name="accountNumber" className="field font-mono" inputMode="numeric" placeholder="01712 345 678" required /></div>
        <div><label className="label" htmlFor="accountName">Account holder</label><input id="accountName" name="accountName" className="field" placeholder="Name on the account" required /></div>
        <div className="flex flex-col gap-3 sm:col-span-2"><Message feedback={feedback} /><button className="btn-secondary" disabled={loading}>{loading && <LoaderCircle size={15} className="animate-spin" />}Add account for verification</button></div>
      </form>}
    </Panel>
  );
}

function PostUpdate({ campaign }: { campaign: Campaign }) {
  const { loading, feedback, run } = useSubmit();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = Object.fromEntries(new FormData(element).entries());
    if (await run(() => apiRequest(`/api/campaigns/${campaign.id}/updates`, { json: form }), "Update published. Supporters have been notified.")) element.reset();
  }
  return (
    <Panel icon={<Megaphone />} title="Post a public update" subtitle="Share progress. Everyone with a verified gift is notified.">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]"><div><label className="label" htmlFor="update-title">Title</label><input id="update-title" name="title" className="field" minLength={4} maxLength={120} placeholder="Surgery completed successfully" required /></div><div><label className="label" htmlFor="update-type">Type</label><select id="update-type" name="type" className="field" defaultValue="update"><option value="update">Update</option><option value="milestone">Milestone</option></select></div></div>
        <div><label className="label" htmlFor="update-body">Update</label><textarea id="update-body" name="body" className="field min-h-24" minLength={10} maxLength={2000} placeholder="Avoid medical details, addresses, and phone numbers." required /></div>
        <Message feedback={feedback} />
        <button className="btn-primary" disabled={loading}>{loading && <LoaderCircle size={15} className="animate-spin" />}Publish update</button>
      </form>
    </Panel>
  );
}

function RecordDisbursement({ campaign, available, disbursements }: { campaign: Campaign; available: number; disbursements: Disbursement[] }) {
  const { loading, feedback, run } = useSubmit();
  const [file, setFile] = useState<File | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    if (file) form.set("evidence", file);
    if (await run(() => apiRequest(`/api/campaigns/${campaign.id}/disbursements`, { form }), "Delivery recorded. It will appear publicly once reviewers verify the receipt.")) {
      element.reset();
      setFile(null);
    }
  }
  return (
    <Panel id="disbursements" icon={<Truck />} title="Deliveries to the beneficiary" subtitle="Show where collected money went. Verified deliveries appear on your public page.">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <form onSubmit={submit} className="space-y-3">
          <p className="rounded-xl bg-cream p-3 text-xs text-ink/60"><strong className="text-forest">{formatBDT(available)}</strong> of verified gifts is not yet reported as delivered.</p>
          <div className="grid gap-3 sm:grid-cols-2"><div><label className="label" htmlFor="d-amount">Amount (BDT)</label><input id="d-amount" name="amount" type="number" min={1} max={available || undefined} step={1} className="field" required disabled={!available} /></div><div><label className="label" htmlFor="d-recipient">Paid to</label><input id="d-recipient" name="recipient" className="field" placeholder="Hospital, school, supplier…" required disabled={!available} /></div></div>
          <div><label className="label" htmlFor="d-description">What it covered</label><textarea id="d-description" name="description" className="field min-h-20" minLength={10} maxLength={500} required disabled={!available} /></div>
          <div><label className="label" htmlFor="d-evidence">Receipt or invoice</label><label htmlFor="d-evidence" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-forest/30 bg-emerald-50/40 p-3"><FileUp size={17} className="text-forest" /><span className="truncate text-xs font-bold text-forest">{file?.name ?? "Choose PNG, JPG, WebP or PDF"}</span></label><input id="d-evidence" type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={!available} /></div>
          <Message feedback={feedback} />
          <button className="btn-primary w-full" disabled={loading || !available || !file}>{loading && <LoaderCircle size={15} className="animate-spin" />}Submit delivery for verification</button>
        </form>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-ink/35">History</p>
          <ul className="mt-3 space-y-2">
            {disbursements.length ? disbursements.map((entry) => <li key={entry.id} className="rounded-xl border border-ink/8 p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold">{entry.recipient}</p><p className="mt-0.5 text-[11px] text-ink/50">{entry.description}</p><p className="mt-0.5 text-[10px] text-ink/35">{formatDate(entry.submittedAt)}{entry.reviewNote ? ` · ${entry.reviewNote}` : ""}</p></div><div className="text-right"><p className="text-sm font-bold text-forest">{formatBDT(entry.amount)}</p><div className="mt-1"><StatusBadge status={entry.status} /></div></div></div></li>) : <li className="flex items-center gap-2 rounded-xl bg-cream p-3 text-xs text-ink/50"><CheckCircle2 size={14} /> No deliveries recorded yet.</li>}
          </ul>
        </div>
      </div>
    </Panel>
  );
}
