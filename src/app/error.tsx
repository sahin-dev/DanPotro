"use client";

import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex flex-1 items-center py-20">
      <div className="shell">
        <div className="surface mx-auto max-w-xl bg-white p-8 text-center sm:p-12">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-red-700"><AlertTriangle size={28} /></span>
          <h1 className="mt-6 font-display text-4xl font-bold text-forest">Something went wrong.</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink/52">We could not load this page. Nothing you submitted has been lost. Please try again.</p>
          {error.digest && <p className="mt-3 font-mono text-[11px] text-ink/35">Reference: {error.digest}</p>}
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={() => retry()} className="btn-primary"><RotateCcw size={15} /> Try again</button>
            <Link href="/" className="btn-secondary"><ArrowLeft size={15} /> Return home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
