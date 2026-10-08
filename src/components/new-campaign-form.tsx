"use client";

import { ArrowRight, CheckCircle2, FileUp, LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiRequest, errorMessage } from "@/lib/client";

export function NewCampaignForm() {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [result, setResult] = useState<{ id: string; slug: string } | null>(null);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    form.delete("documents");
    for (const file of documents) form.append("documents", file);
    try {
      const data = await apiRequest<{ campaign: { id: string; slug: string } }>("/api/campaigns", { form });
      setResult(data.campaign);
    } catch (caught) {
      setError(errorMessage(caught, "Could not submit this cause."));
    } finally {
      setLoading(false);
    }
  }

  if (result) return <div className="surface bg-white p-8 text-center sm:p-12"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-forest"><CheckCircle2 size={30} /></span><p className="eyebrow mt-6">Submission received</p><h2 className="mt-3 font-display text-3xl font-bold text-forest">Your cause is in private review.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink/52">It is not public yet. A reviewer will verify the beneficiary relationship, evidence, and payment destinations before activation.</p><p className="mx-auto mt-3 max-w-md rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Next step:</strong> add at least one bKash, Nagad, Rocket, or bank account so reviewers can verify where donors will send money.</p><div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><Link href={`/dashboard/campaigns/${result.id}`} className="btn-primary">Add payment account <ArrowRight size={16} /></Link><Link href={`/campaigns/${result.slug}`} className="btn-secondary">Preview record</Link></div></div>;

  return (
    <form onSubmit={submit} className="surface bg-white p-6 sm:p-9">
      <div className="flex items-center justify-between gap-4 border-b border-ink/7 pb-6"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-coral">Cause application</p><h2 className="mt-1 font-display text-3xl font-bold text-forest">Tell the full story</h2></div><span className="flex items-center gap-1 text-[10px] font-bold text-forest"><LockKeyhole size={13} /> Draft is private</span></div>
      <div className="mt-7 grid gap-5">
        <div><label className="label" htmlFor="title">Cause title</label><input id="title" name="title" className="field" placeholder="Help Ayesha receive urgent treatment" minLength={12} maxLength={120} required /></div>
        <div><label className="label" htmlFor="summary">Short public summary</label><textarea id="summary" name="summary" className="field min-h-24" placeholder="Explain who needs help, what happened, and what the funds cover." minLength={30} maxLength={300} required /><p className="mt-1.5 text-[10px] text-ink/35">Avoid phone numbers, full addresses, and sensitive medical details.</p></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label className="label" htmlFor="category">Category</label><select id="category" name="category" className="field" defaultValue="Medical"><option>Medical</option><option>Emergency</option><option>Education</option><option>Food support</option></select></div><div><label className="label" htmlFor="goalAmount">Goal amount (BDT)</label><input id="goalAmount" name="goalAmount" className="field" type="number" min="1000" step="500" placeholder="250000" required /></div></div>
        <div><label className="label" htmlFor="location">General location</label><input id="location" name="location" className="field" placeholder="District, Bangladesh" required /></div>
        <div><label className="label" htmlFor="story">Full public story</label><textarea id="story" name="story" className="field min-h-36" placeholder="Describe the background, urgency, cost breakdown, and how progress will be reported." minLength={80} required /></div>
        <div className="border-t border-ink/7 pt-6"><p className="text-sm font-bold text-forest">Beneficiary information <span className="font-normal text-ink/35">· private until approved</span></p><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><label className="label" htmlFor="beneficiaryName">Beneficiary name</label><input id="beneficiaryName" name="beneficiaryName" className="field" placeholder="Legal name" required /></div><div><label className="label" htmlFor="beneficiaryRelationship">Your relationship</label><input id="beneficiaryRelationship" name="beneficiaryRelationship" className="field" placeholder="e.g. neighbour, family friend" required /></div></div></div>
        <div><label className="label" htmlFor="documents">Supporting documents</label><label htmlFor="documents" className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-forest/25 bg-emerald-50/35 p-4"><span className="grid size-10 place-items-center rounded-full bg-white text-forest"><FileUp size={18} /></span><span><span className="block text-xs font-bold text-forest">{documents.length ? `${documents.length} file(s) selected` : "Choose private evidence"}</span><span className="mt-0.5 block text-[10px] text-ink/40">Medical records, estimates, identity or referral letters · PNG, JPG, WebP or PDF · up to 5 files, 5 MB each</span></span></label><input id="documents" name="documents" className="sr-only" type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setDocuments(Array.from(event.target.files ?? []).slice(0, 5))} />{documents.length > 0 && <ul className="mt-2 space-y-1 text-[11px] text-ink/55">{documents.map((file) => <li key={file.name} className="truncate">• {file.name}</li>)}</ul>}</div>
      </div>
      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-ink/7 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-sm text-[10px] leading-4 text-ink/38">By submitting, you confirm you have permission to share this story and supporting evidence with the review team.</p><button className="btn-primary shrink-0" disabled={loading}>{loading ? <LoaderCircle size={16} className="animate-spin" /> : <LockKeyhole size={16} />}{loading ? "Submitting…" : "Submit for private review"}</button></div>
    </form>
  );
}
