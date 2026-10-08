export function PolicyPage({ eyebrow, title, updated, sections }: { eyebrow: string; title: string; updated: string; sections: Array<{ heading: string; body: React.ReactNode }> }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="shell max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] text-forest sm:text-5xl">{title}</h1>
        <p className="mt-3 text-xs text-ink/45">Last updated {updated}</p>
        <div className="surface mt-8 space-y-8 bg-white p-6 sm:p-10">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl font-bold text-forest">{section.heading}</h2>
              <div className="mt-2 space-y-2 text-sm leading-7 text-ink/65">{section.body}</div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
