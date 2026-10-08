import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { getUnreadCount } from "@/lib/db";

export async function AuthenticatedHeader() {
  const session = await getSession();
  return (
    <SiteHeader
      user={session ? { displayName: session.displayName, role: session.role, unread: getUnreadCount(session.userId) } : null}
    />
  );
}
