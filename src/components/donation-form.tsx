"use client";

import { ArrowRight, CheckCircle2, Clipboard, ClipboardCheck, FileUp, LoaderCircle, LockKeyhole, PauseCircle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

import { apiRequest, errorMessage } from "@/lib/client";
import { copyText } from "@/lib/clipboard";
import type { Campaign, UserRole } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;

function localDateTime(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function Destinations({ campaign, selected, onSelect }: { campaign: Campaign; selected?: string; onSelect?: (id: string) => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(id: string, value: string) {
    if (!(await copyText(value.replaceAll(" ", "")))) return;
    setCopied(id);
    setTimeout(() => setCopied(null), 1_500);
  }
  return (
    <div className="grid gap-2">
      {campaign.paymentMethods.map((item) => {
        const content = <><span><span className="block text-xs font-bold">{item.provider} · {item.type}</span><span className="mt-0.5 block text-sm font-extrabold text-forest">{item.accountNumber}</span><span className="text-[10px] text-ink/40">{item.accountName}</span></span><span className="flex items-center gap-2"><button type="button" aria-label={`Copy ${item.provider} account number`} onClick={(event) => { event.preventDefault(); copy(item.id, item.accountNumber); }} className="grid size-8 place-items-center rounded-full text-ink/40 hover:bg-white hover:text-forest">{copied === item.id ? <ClipboardCheck size={15} className="text-forest" /> : <Clipboard size={15} />}</button>{onSelect && <input type="radio" name="method" checked={selected === item.id} onChange={() => onSelect(item.id)} aria-label={`Paid with ${item.provider}`} />}</span></>;
        return onSelect
          ? <label key={item.id} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${selected === item.id ? "border-forest bg-emerald-50/60" : "border-ink/8"}`}>{content}</label>
          : <div key={item.id} className="flex items-center justify-between rounded-xl border border-ink/8 bg-cream/55 p-3">{content}</div>;
      })}
    </div>
  );
}

export function DonationForm({ campaign, viewerRole }: { campaign: Campaign; viewerRole: UserRole | null }) {
  const [methodId, setMethodId] = useState(campaign.paymentMethods[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const paidAtRef = useRef<HTMLInputElement>(null);
  const method = campaign.paymentMethods.find((item) => item.id === methodId);

  // Set in the browser so the default uses the donor's time zone, not the server's.
  useEffect(() => {
    if (paidAtRef.current && !paidAtRef.current.value) paidAtRef.current.value = localDateTime();
  }, [success]);

  if (campaign.status !== "active" || !campaign.paymentMethods.length) {
    const funded = campaign.status === "funded";
    return <div className="surface bg-white p-6 text-center">{funded ? <CheckCircle2 className="mx-auto text-forest" /> : <PauseCircle className="mx-auto text-ink/40" />}<h2 className="mt-3 font-display text-2xl font-bold text-forest">{funded ? "This cause is fully funded" : campaign.status === "closed" ? "This cause has closed" : "Not accepting gifts right now"}</h2><p className="mt-2 text-xs leading-5 text-ink/50">{funded || campaign.status === "closed" ? "The public record remains open so you can follow how funds are delivered." : "New payment records open once the review team verifies this campaign and its payment destinations."}</p>{funded && <Link href="/campaigns" className="btn-secondary mt-5">Find another cause <ArrowRight size={15} /></Link>}</div>;
  }

  if (viewerRole !== "donor") {
    return <div className="surface overflow-hidden bg-white"><div className="bg-forest px-6 py-5 text-white"><p className="text-[11px] font-bold uppercase tracking-[.15em] text-mint">Verified payment destinations</p><h2 className="mt-1 font-display text-2xl font-bold">Send directly, record privately</h2></div><div className="space-y-3 p-6"><Destinations campaign={campaign} /><ol className="space-y-1.5 rounded-xl bg-cream/70 p-3 text-[11px] leading-5 text-ink/60"><li><strong>1.</strong> Send money to one of the accounts above.</li><li><strong>2.</strong> Keep the transaction ID and a screenshot.</li><li><strong>3.</strong> Record it here so it can be verified and counted.</li></ol>{viewerRole
      ? <div className="rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">Fundraiser and reviewer accounts cannot record gifts. Use a separate donor account.</div>
      : <><Link href={`/register?next=/campaigns/${campaign.slug}`} className="btn-primary w-full"><LockKeyhole size={15} /> Create a donor account</Link><p className="text-center text-[11px] text-ink/45">Already have one? <Link href={`/login?next=/campaigns/${campaign.slug}`} className="font-bold text-forest hover:underline">Sign in</Link></p></>}</div></div>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError("Attach a payment screenshot or receipt.");
    if (file.size > MAX_BYTES) return setError("Files must be 5 MB or smaller.");
    setLoading(true);
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    form.set("campaignId", campaign.id);
    form.set("provider", method?.provider ?? "");
    form.set("paidAt", new Date(String(form.get("paidAt"))).toISOString());
    form.set("evidence", file);
    form.delete("method");
    try {
      const result = await apiRequest<{ message: string }>("/api/donations", { form });
      setSuccess(result.message);
      formRef.current?.reset();
      setFile(null);
    } catch (caught) {
      setError(errorMessage(caught, "Could not submit the record."));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <div className="surface bg-white p-6 text-center"><span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 text-forest"><CheckCircle2 size={24} /></span><h2 className="mt-4 font-display text-2xl font-bold text-forest">Thank you — record received</h2><p role="status" className="mt-2 text-xs leading-5 text-ink/55">{success}</p><p className="mt-2 text-[11px] text-ink/45">We will notify you at each step. Most records are reviewed within two working days.</p><div className="mt-5 grid gap-2"><Link href="/dashboard" className="btn-primary">Track it in your dashboard</Link><button onClick={() => setSuccess("")} className="btn-secondary">Record another payment</button></div></div>;
  }

  return (
    <div className="surface overflow-hidden bg-white">
      <div className="bg-forest px-6 py-5 text-white"><p className="text-[11px] font-bold uppercase tracking-[.15em] text-mint">Already sent money?</p><h2 className="mt-1 font-display text-2xl font-bold">Add it to the record</h2><p className="mt-2 text-[11px] leading-5 text-white/55">This form records a payment; it does not transfer money.</p></div>
      <form ref={formRef} onSubmit={submit} className="space-y-4 p-6">
        <fieldset><legend className="label">Which verified account did you pay?</legend><Destinations campaign={campaign} selected={methodId} onSelect={setMethodId} /></fieldset>
        <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="amount">Amount (BDT)</label><input className="field" id="amount" name="amount" type="number" inputMode="numeric" min="1" max="500000" step="1" placeholder="2000" required /></div><div><label className="label" htmlFor="senderLastFour">Sender last 4 digits</label><input className="field" id="senderLastFour" name="senderLastFour" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="4821" title="Four digits" required /></div></div>
        <div><label className="label" htmlFor="transactionId">Transaction ID</label><input className="field uppercase" id="transactionId" name="transactionId" placeholder="e.g. BKA8N2K91Q" minLength={6} maxLength={40} autoComplete="off" required /></div>
        <div><label className="label" htmlFor="paidAt">Payment date & time</label><input className="field" id="paidAt" name="paidAt" type="datetime-local" ref={paidAtRef} required /></div>
        <div><label className="label" htmlFor="evidence">Private payment screenshot</label><label htmlFor="evidence" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-forest/30 bg-emerald-50/40 p-3.5 focus-within:border-forest"><span className="grid size-9 place-items-center rounded-full bg-white text-forest"><FileUp size={17} /></span><span className="min-w-0"><span className="block truncate text-xs font-bold text-forest">{file?.name || "Choose a screenshot or PDF"}</span><span className="text-[10px] text-ink/40">PNG, JPG, WebP or PDF · up to 5 MB · reviewers only</span></span></label><input className="sr-only" id="evidence" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
        <div><label className="label" htmlFor="note">Private note <span className="font-normal text-ink/35">(optional)</span></label><textarea className="field min-h-20 resize-y" id="note" name="note" maxLength={1000} placeholder="Anything the reviewer should know" /></div>
        {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</div>}
        <button className="btn-coral w-full" disabled={loading}>{loading ? <LoaderCircle size={17} className="animate-spin" /> : <LockKeyhole size={16} />}{loading ? "Submitting…" : "Submit private evidence"}</button>
        <p className="text-center text-[10px] leading-4 text-ink/38">You are recording {method ? `a ${method.provider} payment` : "a payment"}. False evidence can add demerit points and restrict future submissions.</p>
      </form>
    </div>
  );
}
