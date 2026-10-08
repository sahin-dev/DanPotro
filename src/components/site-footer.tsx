import { HeartHandshake, Mail } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto print:hidden border-t border-ink/10 bg-forest text-white">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-white/10">
              <HeartHandshake size={19} />
            </span>
            <span className="font-display text-2xl font-bold">Shohay.</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-white/65">
            A transparent record for community giving. Protecting donor privacy while making every verified taka accountable.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint">Platform</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            <Link href="/campaigns" className="hover:text-white">Browse causes</Link>
            <Link href="/how-it-works" className="hover:text-white">How it works</Link>
            <Link href="/transparency" className="hover:text-white">Trust & safety</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mint">Need help?</p>
          <a href="mailto:support@shohay.org" className="mt-4 flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <Mail size={16} /> support@shohay.org
          </a>
          <p className="mt-5 text-xs leading-5 text-white/45">For emergencies, contact local authorities. Shohay does not provide medical or financial advice.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/45">
        © {new Date().getFullYear()} Shohay. Built for transparent giving in Bangladesh.
      </div>
    </footer>
  );
}
