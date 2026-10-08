import { HeartHandshake } from "lucide-react";

/** Centered single-column card used by registration and password recovery screens. */
export function AuthCard({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="relative flex flex-1 items-center overflow-hidden py-12 sm:py-16">
      <div className="absolute -left-24 top-12 size-72 rounded-full bg-mint/35 blur-3xl" />
      <div className="absolute -right-20 bottom-0 size-80 rounded-full bg-coral/10 blur-3xl" />
      <div className="shell relative">
        <div className="surface mx-auto max-w-lg bg-white/90 p-7 sm:p-10">
          <span className="grid size-11 place-items-center rounded-full bg-forest text-white"><HeartHandshake size={20} /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-coral">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-forest sm:text-4xl">{title}</h1>
          {intro && <div className="mt-2 text-xs leading-5 text-ink/50">{intro}</div>}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </section>
  );
}
