"use client";

import { Bell, CheckCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/lib/client";
import { formatRelative } from "@/lib/format";
import type { Notification } from "@/lib/types";

export function NotificationList({ initial }: { initial: Notification[] }) {
  const [items, setItems] = useState(initial);
  const router = useRouter();
  const unread = items.filter((item) => !item.readAt).length;

  async function markRead(id?: string) {
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) => (!id || item.id === id) && !item.readAt ? { ...item, readAt } : item));
    await apiRequest("/api/notifications", { json: id ? { id } : {} }).catch(() => undefined);
    router.refresh();
  }

  if (!items.length) {
    return <div className="surface mt-8 bg-white py-16 text-center"><Bell className="mx-auto text-forest/30" /><p className="mt-3 text-sm font-bold text-forest">You are all caught up.</p><p className="mt-1 text-xs text-ink/45">Status changes on your gifts and campaigns will appear here.</p></div>;
  }

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-ink/50"><strong className="text-ink">{unread}</strong> unread</p>
        <button onClick={() => markRead()} disabled={!unread} className="flex items-center gap-1.5 text-xs font-bold text-forest disabled:opacity-40"><CheckCheck size={14} /> Mark all as read</button>
      </div>
      <ul className="surface divide-y divide-ink/7 overflow-hidden bg-white">
        {items.map((item) => {
          const body = <><span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.readAt ? "bg-transparent" : "bg-coral"}`} aria-hidden /><span className="min-w-0 flex-1"><span className="flex items-baseline justify-between gap-3"><span className={`text-sm ${item.readAt ? "font-semibold text-ink/70" : "font-bold text-ink"}`}>{item.title}</span><span className="shrink-0 text-[10px] text-ink/35">{formatRelative(item.createdAt)}</span></span><span className="mt-1 block text-xs leading-5 text-ink/50">{item.body}</span></span>{item.href && <ChevronRight size={16} className="mt-1 shrink-0 text-ink/25" />}</>;
          return (
            <li key={item.id}>
              {item.href
                ? <Link href={item.href} onClick={() => !item.readAt && markRead(item.id)} className="flex gap-3 p-4 hover:bg-cream/60 sm:p-5">{body}</Link>
                : <button onClick={() => !item.readAt && markRead(item.id)} className="flex w-full gap-3 p-4 text-left hover:bg-cream/60 sm:p-5">{body}</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
