import { NoticeAudience, NoticePriority, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";
import { createNotificationForMany } from "../notifications/notifications.service";

interface NoticeInput {
  title: string;
  content: string;
  audience: NoticeAudience;
  priority?: NoticePriority;
  sectionId?: string;
  classId?: string;
  expiresAt?: Date;
}

export async function createNotice(authorId: string, data: NoticeInput) {
  if (data.audience === "SECTION" && !data.sectionId) {
    throw ApiError.badRequest("sectionId is required when audience is SECTION");
  }
  if (data.audience === "CLASS" && !data.classId) {
    throw ApiError.badRequest("classId is required when audience is CLASS");
  }

  const notice = await prisma.notice.create({ data: { ...data, authorId } });
  await fanOutNotifications(notice.id);
  return notice;
}

export async function updateNotice(id: string, data: Partial<NoticeInput>) {
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Notice not found");
  return prisma.notice.update({ where: { id }, data });
}

async function fanOutNotifications(noticeId: string) {
  const notice = await prisma.notice.findUnique({ where: { id: noticeId } });
  if (!notice) return;

  let userIds: string[] = [];

  if (notice.audience === "ALL") {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (notice.audience === "TEACHERS") {
    const users = await prisma.user.findMany({ where: { role: Role.TEACHER, isActive: true }, select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (notice.audience === "STUDENTS") {
    const users = await prisma.user.findMany({ where: { role: Role.STUDENT, isActive: true }, select: { id: true } });
    userIds = users.map((u) => u.id);
  } else if (notice.audience === "SECTION" && notice.sectionId) {
    const students = await prisma.student.findMany({ where: { sectionId: notice.sectionId }, select: { userId: true } });
    userIds = students.map((s) => s.userId);
  } else if (notice.audience === "CLASS" && notice.classId) {
    const students = await prisma.student.findMany({ where: { classId: notice.classId }, select: { userId: true } });
    userIds = students.map((s) => s.userId);
  }

  await createNotificationForMany({
    userIds,
    type: "ANNOUNCEMENT",
    priority: notice.priority === "IMPORTANT" ? "HIGH" : "NORMAL",
    title: notice.title,
    message: notice.content.slice(0, 200),
    link: `/notices/${notice.id}`,
  });
}

export async function listNoticesForUser(role: Role, sectionId: string | null, classId: string | null, query: PaginationQuery) {
  const notExpired = { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] };

  let audienceCondition: Record<string, unknown>;
  if (role === Role.SUPER_ADMIN) {
    audienceCondition = {};
  } else if (role === Role.TEACHER) {
    audienceCondition = { audience: { in: ["ALL", "TEACHERS"] as NoticeAudience[] } };
  } else {
    // Students: general audiences, plus SECTION/CLASS notices scoped to their own section/class.
    audienceCondition = {
      OR: [
        { audience: { in: ["ALL", "STUDENTS"] as NoticeAudience[] } },
        ...(sectionId ? [{ audience: "SECTION" as NoticeAudience, sectionId }] : []),
        ...(classId ? [{ audience: "CLASS" as NoticeAudience, classId }] : []),
      ],
    };
  }

  const search = query.search
    ? {
        OR: [
          { title: { contains: query.search, mode: "insensitive" as const } },
          { content: { contains: query.search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where = { AND: [audienceCondition, notExpired, search] };

  const [items, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      include: { author: { select: { email: true, role: true } } },
      ...toSkipTake(query),
      orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
    }),
    prisma.notice.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function deleteNotice(id: string) {
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Notice not found");
  await prisma.notice.delete({ where: { id } });
}
