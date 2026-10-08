"use client";

import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

import { copyText } from "@/lib/clipboard";

export function ShareCampaign({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}${path}`;
  const message = `${title} — follow every verified taka on Shohay:`;

  async function copy() {
    if (await copyText(url())) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } else {
      window.prompt("Copy this link", url());
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title, text: message, url: url() }).catch(() => undefined);
    } else {
      await copy();
    }
  }

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer,width=640,height=560");

  return (
    <div className="mt-3 rounded-2xl border border-ink/8 bg-white/55 p-4">
      <p className="flex items-center gap-2 text-xs font-bold text-ink/55"><Share2 size={15} /> Share this record</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={copy} className="btn-secondary !min-h-9 !px-2 text-[11px]">{copied ? <Check size={13} /> : <Link2 size={13} />}{copied ? "Copied" : "Copy link"}</button>
        <button type="button" onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${message} ${url()}`)}`)} className="btn-secondary !min-h-9 !px-2 text-[11px]"><MessageCircle size={13} />WhatsApp</button>
        <button type="button" onClick={nativeShare} className="btn-secondary !min-h-9 !px-2 text-[11px]"><Share2 size={13} />More</button>
      </div>
      <button type="button" onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`)} className="mt-2 w-full text-center text-[11px] font-bold text-forest hover:underline">Share on Facebook</button>
    </div>
  );
}
