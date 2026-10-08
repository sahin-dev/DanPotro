import { handleApi, parseJson } from "@/lib/api";
import { requireApiRole } from "@/lib/auth";
import { getNotifications, getUnreadCount, markNotificationsRead } from "@/lib/db";
import { markReadSchema } from "@/lib/validation";

export const GET = handleApi(async () => {
  const session = await requireApiRole();
  return Response.json({ notifications: getNotifications(session.userId), unread: getUnreadCount(session.userId) });
});

/** Mark one notification (`{ id }`) or all of them (`{}`) as read. */
export const POST = handleApi(async (request) => {
  const session = await requireApiRole();
  const { id } = await parseJson(request, markReadSchema);
  markNotificationsRead(session.userId, id);
  return Response.json({ unread: getUnreadCount(session.userId) });
});
