"use client";

import { AlertTriangle, CheckCircle2, LoaderCircle, X } from "lucide-react";
import { FormEvent, useState } from "react";
import Link from "next/link";

import { apiRequest, errorMessage } from "@/lib/client";

export function ReportCampaign({ campaignId, isAuthenticated, returnTo }: { campaignId: string; isAuthenticated: boolean; returnTo: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await apiRequest<{ message: string }>("/api/reports", { json: { campaignId, category: form.get("category"), detail: form.get("detail") } });
      setMessage(data.message);
    } catch (caught) {
      setError(errorMessage(caught, "Could not submit this report."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-ink/8 bg-white/55 p-4">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 text-left text-xs font-bold text-ink/55 hover:text-red-700">
        <span className="flex items-center gap-2"><AlertTriangle size={15} /> Report a concern privately</span>{open ? <X size={14} /> : <span>Open</span>}
      </button>
      {open && <div className="pt-4">{!isAuthenticated ? <div className="rounded-xl bg-cream p-3 text-xs leading-5 text-ink/55"><p>Sign in before sending a confidential report so the review team can prevent duplicate abuse reports.</p><Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="mt-2 inline-flex font-bold text-forest hover:underline">Sign in to report</Link></div> : message ? <div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"><CheckCircle2 size={15} className="mt-0.5 shrink-0" /> {message}</div> : <form onSubmit={submit} className="space-y-3"><div><label className="label" htmlFor="report-category">What is wrong?</label><select id="report-category" name="category" className="field" defaultValue="false_story"><option value="false_story">The story may be false</option><option value="wrong_payment_account">Payment account mismatch</option><option value="fund_misuse">Funds may be misused</option><option value="privacy">Privacy or consent concern</option><option value="other">Another safety concern</option></select></div><div><label className="label" htmlFor="report-detail">What should reviewers check?</label><textarea id="report-detail" name="detail" className="field min-h-24" minLength={20} placeholder="Share specific facts or links. Your report is not public." required /></div>{error && <p className="text-[11px] leading-4 text-red-700">{error}</p>}<button className="btn-secondary w-full !min-h-10 text-xs text-red-700" disabled={loading}>{loading ? <LoaderCircle size={14} className="animate-spin" /> : <AlertTriangle size={14} />}{loading ? "Sending…" : "Send confidential report"}</button></form>}</div>}
    </div>
  );
}
