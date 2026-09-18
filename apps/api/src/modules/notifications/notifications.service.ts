import { NotificationPriority, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";

/** Reusable helper: create a notification for a single user. Used by other modules. */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { ...input, priority: input.priority ?? "NORMAL" },
  });
}

/** Reusable helper: create the same notification for many users at once. */
export async function createNotificationForMany(input: {
  userIds: string[];
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  link?: string;
}) {
  if (input.userIds.length === 0) return { count: 0 };
  return prisma.notification.createMany({
    data: input.userIds.map((userId) => ({
      userId,
      type: input.type,
      priority: input.priority ?? "NORMAL",
      title: input.title,
      message: input.message,
      link: input.link,
    })),
  });
}

interface ListQuery extends PaginationQuery {
  unreadOnly: boolean;
}

export async function listNotifications(userId: string, query: ListQuery) {
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(query.unreadOnly ? { isRead: false } : {}),
  };

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, unreadCount, meta: paginationMeta(query.page, query.limit, total) };
}

export async function markAsRead(userId: string, id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw ApiError.notFound("Notification not found");
  }
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

export async function deleteNotification(userId: string, id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw ApiError.notFound("Notification not found");
  }
  await prisma.notification.delete({ where: { id } });
}
