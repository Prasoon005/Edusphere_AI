import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";
import { createNotification } from "../notifications/notifications.service";

export async function sendFeedback(
  senderId: string,
  data: { receiverId: string; subject: string; message: string; rating?: number }
) {
  const receiver = await prisma.user.findUnique({ where: { id: data.receiverId } });
  if (!receiver) throw ApiError.badRequest("Recipient does not exist");

  const feedback = await prisma.feedback.create({
    data: { senderId, ...data },
    include: { sender: { select: { email: true, role: true } } },
  });

  await createNotification({
    userId: data.receiverId,
    type: "FEEDBACK_RECEIVED",
    title: `New feedback: ${data.subject}`,
    message: data.message.slice(0, 200),
    link: `/feedback/${feedback.id}`,
  });

  return feedback;
}

export async function listReceivedFeedback(userId: string, query: PaginationQuery) {
  const where = { receiverId: userId };
  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { sender: { select: { email: true, role: true } } },
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
    }),
    prisma.feedback.count({ where }),
  ]);
  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function listSentFeedback(userId: string, query: PaginationQuery) {
  const where = { senderId: userId };
  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { receiver: { select: { email: true, role: true } } },
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
    }),
    prisma.feedback.count({ where }),
  ]);
  return { items, meta: paginationMeta(query.page, query.limit, total) };
}
