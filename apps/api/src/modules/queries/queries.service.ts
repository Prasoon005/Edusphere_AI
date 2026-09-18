import { Prisma, QueryStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";
import { createNotification } from "../notifications/notifications.service";

const queryInclude = {
  student: { select: { id: true, fullName: true, rollNumber: true, userId: true } },
  subject: true,
  replies: { include: { teacher: { select: { id: true, fullName: true } } }, orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.QueryInclude;

interface ListQuery extends PaginationQuery {
  subjectId?: string;
  status?: QueryStatus;
}

export async function createQuery(studentId: string, data: { subjectId: string; title: string; message: string }) {
  const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
  if (!subject) throw ApiError.badRequest("Subject does not exist");

  return prisma.query.create({
    data: { studentId, ...data },
    include: queryInclude,
  });
}

export async function listMyQueries(studentId: string, query: ListQuery) {
  const where: Prisma.QueryWhereInput = {
    studentId,
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.query.findMany({ where, include: queryInclude, ...toSkipTake(query), orderBy: { createdAt: "desc" } }),
    prisma.query.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

/** Queries visible to a teacher: for subjects they teach. */
export async function listQueriesForTeacher(teacherId: string, query: ListQuery) {
  const assignments = await prisma.teacherSubject.findMany({ where: { teacherId } });
  const subjectIds = assignments.map((a) => a.subjectId);

  const where: Prisma.QueryWhereInput = {
    subjectId: query.subjectId ? query.subjectId : { in: subjectIds },
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { student: { fullName: { contains: query.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.query.findMany({ where, include: queryInclude, ...toSkipTake(query), orderBy: { createdAt: "desc" } }),
    prisma.query.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function getQueryById(id: string) {
  const query = await prisma.query.findUnique({ where: { id }, include: queryInclude });
  if (!query) throw ApiError.notFound("Query not found");
  return query;
}

export async function replyToQuery(queryId: string, teacherId: string, message: string) {
  const query = await prisma.query.findUnique({ where: { id: queryId }, include: { student: true } });
  if (!query) throw ApiError.notFound("Query not found");

  const [reply] = await prisma.$transaction([
    prisma.queryReply.create({ data: { queryId, teacherId, message } }),
    prisma.query.update({
      where: { id: queryId },
      data: { status: query.status === "OPEN" ? "IN_PROGRESS" : query.status },
    }),
  ]);

  await createNotification({
    userId: query.student.userId,
    type: "QUERY_REPLY",
    title: `New reply to: ${query.title}`,
    message: message.slice(0, 200),
    link: `/queries/${queryId}`,
  });

  return reply;
}

export async function updateQueryStatus(id: string, status: QueryStatus) {
  const existing = await prisma.query.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Query not found");

  return prisma.query.update({
    where: { id },
    data: { status, resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : null },
  });
}
