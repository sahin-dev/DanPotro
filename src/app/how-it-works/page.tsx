import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, EyeOff, FileSearch, ReceiptText, Send, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "How verification works" };

export default function HowItWorksPage() {
  const steps = [
    { icon: <Send />, title: "Pay using a listed method", text: "Send money directly to a payment account that the platform has checked for this cause." },
    { icon: <EyeOff />, title: "Submit proof privately", text: "Record the amount, reference, sender digits, time, and screenshot. None of it becomes public." },
    { icon: <FileSearch />, title: "Fundraiser confirms receipt", text: "The fundraiser checks their bKash, Nagad, bank, or merchant statement and confirms or disputes it." },
    { icon: <ShieldCheck />, title: "Admin makes the decision", text: "A reviewer checks duplicates, inconsistencies, evidence, and both parties' responses before approval." },
    { icon: <CheckCircle2 />, title: "Only the amount goes public", text: "Approved donations update the public total and appear with an anonymous alias and masked reference." },
    { icon: <ReceiptText />, title: "Follow transfer milestones", text: "The fundraiser must later show how collected money reached the beneficiary, hospital, school, or supplier." },
  ];
  return <><section className="bg-forest py-20 text-center text-white"><div className="shell"><p className="eyebrow !text-mint">From payment to public record</p><h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-bold tracking-[-.045em] sm:text-6xl">Privacy for people. Proof for the community.</h1><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60">Shohay verifies two separate events: money reaching the fundraiser, and collected funds reaching the intended beneficiary.</p></div></section><section className="py-20"><div className="shell"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{steps.map((step, index) => <article key={step.title} className="surface bg-white p-6"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-full bg-emerald-50 text-forest [&>svg]:size-20">{step.icon}</span><span className="font-display text-2xl font-bold text-ink/12">0{index + 1}</span></div><h2 className="mt-5 font-display text-xl font-bold text-forest">{step.title}</h2><p className="mt-2 text-xs leading-6 text-ink/50">{step.text}</p></article>)}</div><div className="mt-14 rounded-[2rem] bg-[#eedcc1] px-7 py-10 text-center sm:px-12"><h2 className="font-display text-3xl font-bold text-forest">Ready to add a transparent record?</h2><p className="mx-auto mt-3 max-w-xl text-sm text-ink/55">Browse active causes, pay the fundraiser directly, and then submit your private evidence.</p><Link href="/campaigns" className="btn-primary mt-6">Browse verified causes <ArrowRight size={16} /></Link></div></div></section></>;
}
