"use client";

import { FileText, Inbox, LoaderCircle } from "lucide-react";
import { useState } from "react";

/** Runs a POST to `url` and reports success. Provided by DashboardClient. */
export type Act = (url: string, body: unknown, successMessage: string) => Promise<boolean>;

export function Metric({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "warning" }) {
  return <div className="surface p-5"><div className={`grid size-9 place-items-center rounded-full [&>svg]:size-4 ${tone === "warning" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-forest"}`}>{icon}</div><p className="mt-5 font-display text-2xl font-bold text-forest">{value}</p><p className="mt-1 text-xs text-ink/45">{label}</p></div>;
}

export function SectionTitle({ title, subtitle, count, id }: { title: string; subtitle: string; count?: number; id?: string }) {
  return <div id={id} className="scroll-mt-24"><div className="flex items-center gap-2"><h2 className="font-display text-2xl font-bold text-forest">{title}</h2>{count !== undefined && <span className="rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold text-white">{count}</span>}</div><p className="mt-1 text-xs text-ink/45">{subtitle}</p></div>;
}

export function EmptyState({ message = "Nothing needs attention right now.", children }: { message?: string; children?: React.ReactNode }) {
  return <div className="surface col-span-full bg-white/70 py-12 text-center"><Inbox className="mx-auto text-forest/30" /><p className="mt-3 text-sm font-bold text-forest">{message}</p>{children}</div>;
}

export function FileLink({ fileId, name }: { fileId?: string; name: string }) {
  if (!fileId) return <span className="inline-flex items-center gap-1.5 rounded-lg bg-cream px-2.5 py-1.5 text-[11px] font-bold text-ink/45"><FileText size={13} /> {name}</span>;
  return <a href={`/api/files/${fileId}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg bg-cream px-2.5 py-1.5 text-[11px] font-bold text-forest hover:bg-emerald-50"><FileText size={13} /> {name}</a>;
}

type DecisionAction = { value: string; label: string; tone?: "primary" | "secondary" | "danger"; icon?: React.ReactNode };

/** A required note plus one button per decision. Clears the note after a successful decision. */
export function DecisionBox({
  actions,
  onDecide,
  placeholder = "Required note for the audit trail",
  minLength = 1,
  compact = false,
  children,
}: {
  actions: DecisionAction[];
  onDecide: (value: string, note: string) => Promise<boolean>;
  placeholder?: string;
  minLength?: number;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const ready = note.trim().length >= minLength;

  async function decide(value: string) {
    setBusy(value);
    if (await onDecide(value, note.trim())) setNote("");
    setBusy(null);
  }

  const toneClass = { primary: "btn-primary", secondary: "btn-secondary", danger: "btn-secondary text-red-700" };
  return (
    <div>
      <textarea className={`field ${compact ? "min-h-14 !p-2 text-[11px]" : "min-h-20"}`} value={note} onChange={(event) => setNote(event.target.value)} placeholder={placeholder} maxLength={1000} aria-label={placeholder} />
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-ink/55">{children}</div>
        <div className="flex flex-wrap justify-end gap-2">
          {actions.map((action) => (
            <button key={action.value} disabled={!ready || busy !== null} onClick={() => decide(action.value)} className={`${toneClass[action.tone ?? "secondary"]} ${compact ? "!min-h-8 !px-2.5 text-[10px]" : "!min-h-9 !px-3 text-xs"}`}>
              {busy === action.value ? <LoaderCircle size={13} className="animate-spin" /> : action.icon}{action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Toast({ toast, onClose }: { toast: { type: "success" | "error"; message: string } | null; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div role={toast.type === "error" ? "alert" : "status"} className={`fixed bottom-5 left-1/2 z-[70] flex w-[min(92vw,440px)] -translate-x-1/2 items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm shadow-xl ${toast.type === "success" ? "bg-forest text-white" : "bg-red-700 text-white"}`}>
      <span>{toast.message}</span>
      <button onClick={onClose} className="text-xs font-bold opacity-70 hover:opacity-100" aria-label="Dismiss">✕</button>
    </div>
  );
}
