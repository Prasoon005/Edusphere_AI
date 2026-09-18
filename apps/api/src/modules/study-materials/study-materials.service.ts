import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";

interface ListQuery extends PaginationQuery {
  subjectId?: string;
}

export async function listStudyMaterials(query: ListQuery) {
  const where: Prisma.StudyMaterialWhereInput = {
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.studyMaterial.findMany({
      where,
      include: { subject: true, teacher: { select: { fullName: true } } },
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
    }),
    prisma.studyMaterial.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

/** Materials visible to a student: scoped to their class's subjects. */
export async function listStudyMaterialsForStudent(studentId: string, query: ListQuery) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student?.classId) return { items: [], meta: paginationMeta(query.page, query.limit, 0) };

  const classSubjects = await prisma.classSubject.findMany({ where: { classId: student.classId } });
  const subjectIds = classSubjects.map((cs) => cs.subjectId);

  const where: Prisma.StudyMaterialWhereInput = {
    subjectId: query.subjectId ? query.subjectId : { in: subjectIds },
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.studyMaterial.findMany({
      where,
      include: { subject: true, teacher: { select: { fullName: true } } },
      ...toSkipTake(query),
      orderBy: { createdAt: "desc" },
    }),
    prisma.studyMaterial.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function createStudyMaterial(
  teacherId: string,
  data: { title: string; description?: string; subjectId: string; fileUrl: string; fileType: string; fileSizeKb: number }
) {
  const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
  if (!subject) throw ApiError.badRequest("Subject does not exist");

  return prisma.studyMaterial.create({
    data: { ...data, teacherId },
    include: { subject: true, teacher: { select: { fullName: true } } },
  });
}

export async function deleteStudyMaterial(id: string, teacherId: string) {
  const existing = await prisma.studyMaterial.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Study material not found");
  if (existing.teacherId !== teacherId) throw ApiError.forbidden("You do not own this material");
  await prisma.studyMaterial.delete({ where: { id } });
}
