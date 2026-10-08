import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center py-20">
      <div className="shell">
        <div className="surface mx-auto max-w-xl bg-white p-8 text-center sm:p-12">
          <p className="font-display text-7xl font-bold text-forest/15">404</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-forest">We couldn’t find that page.</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-ink/52">The link may be mistyped, or the cause may still be in private review.</p>
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/campaigns" className="btn-primary"><Search size={15} /> Browse causes</Link>
            <Link href="/" className="btn-secondary"><ArrowLeft size={15} /> Return home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
