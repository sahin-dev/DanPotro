import type { Metadata } from "next";
import { Bell } from "lucide-react";

import { NotificationList } from "@/components/notification-list";
import { requirePageRole } from "@/lib/auth";
import { getNotifications } from "@/lib/db";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default async function NotificationsPage() {
  const session = await requirePageRole(["donor", "fundraiser", "admin"], "/notifications");
  return (
    <section className="py-10 sm:py-14">
      <div className="shell max-w-3xl">
        <p className="eyebrow"><Bell size={15} /> Inbox</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] text-forest sm:text-5xl">Notifications</h1>
        <p className="mt-3 text-sm text-ink/52">Private updates about your gifts, campaigns, and reviews. We never include donor identities in these messages.</p>
        <NotificationList initial={getNotifications(session.userId)} />
      </div>
    </section>
  );
}
