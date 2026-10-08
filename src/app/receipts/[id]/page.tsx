import type { Metadata } from "next";
import { ArrowLeft, BadgeCheck, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/print-button";
import { requirePageRole } from "@/lib/auth";
import { getReceipt } from "@/lib/db";
import { formatBDT, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Gift record", robots: { index: false } };

export default async function ReceiptPage({ params }: PageProps<"/receipts/[id]">) {
  const { id } = await params;
  const session = await requirePageRole(["donor"], `/receipts/${id}`);
  const receipt = getReceipt(id, session.userId);
  if (!receipt) notFound();

  return (
    <section className="py-10 sm:py-14 print:py-0">
      <div className="shell max-w-2xl">
        <Link href="/dashboard" className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-forest hover:underline print:hidden"><ArrowLeft size={14} /> Back to dashboard</Link>
        <article className="surface overflow-hidden bg-white print:border-0 print:shadow-none">
          <header className="flex items-start justify-between gap-4 bg-forest p-7 text-white print:bg-white print:text-forest">
            <div className="flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-full bg-white/10 print:bg-forest/10"><HeartHandshake size={19} /></span><div><p className="font-display text-2xl font-bold">Shohay.</p><p className="text-[10px] uppercase tracking-[.16em] text-mint print:text-forest/60">Verified gift record</p></div></div>
            <div className="text-right"><p className="text-[10px] uppercase tracking-wider text-white/50 print:text-ink/50">Record no.</p><p className="font-mono text-sm font-bold">{receipt.receiptNumber}</p></div>
          </header>
          <div className="p-7">
            <div className="flex items-center gap-2 text-xs font-bold text-forest"><BadgeCheck size={16} /> Independently reviewed and approved</div>
            <p className="mt-4 font-display text-5xl font-bold text-forest">{formatBDT(receipt.amount)}</p>
            <p className="mt-1 text-sm text-ink/55">to “{receipt.campaign.title}”</p>
            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-ink/8 pt-6 text-sm">
              <Row label="Public alias" value={receipt.donorAlias} />
              <Row label="Payment method" value={receipt.provider} />
              <Row label="Transaction reference" value={receipt.reference} mono />
              <Row label="Paid on" value={formatDate(receipt.paidAt, { hour: "numeric", minute: "2-digit" })} />
              <Row label="Approved on" value={formatDate(receipt.approvedAt)} />
              <Row label="Fundraiser" value={receipt.campaign.fundraiserName} />
            </dl>
            <p className="mt-7 rounded-xl bg-cream p-4 text-[11px] leading-5 text-ink/55">This record confirms that Shohay reviewers matched your payment evidence with the fundraiser’s statement. Shohay did not process or hold this payment. It is not a tax or legal receipt.</p>
            <p className="mt-3 text-[11px] text-ink/40">Public record: {`/campaigns/${receipt.campaign.slug}`}</p>
          </div>
        </article>
        <div className="mt-6 flex justify-center"><PrintButton /></div>
      </div>
    </section>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><dt className="text-[10px] font-bold uppercase tracking-wider text-ink/35">{label}</dt><dd className={`mt-1 font-bold text-ink ${mono ? "font-mono" : ""}`}>{value}</dd></div>;
}
