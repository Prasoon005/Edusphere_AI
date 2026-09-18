import { ExamType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";

export async function listExams(filters: { subjectId?: string; semesterId?: string; teacherId?: string }) {
  const where: Prisma.ExamWhereInput = {
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
    ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
  };
  return prisma.exam.findMany({
    where,
    include: { subject: true, semester: true, _count: { select: { marks: true } } },
    orderBy: { examDate: "desc" },
  });
}

export async function getExamById(id: string) {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { subject: true, semester: true },
  });
  if (!exam) throw ApiError.notFound("Exam not found");
  return exam;
}

export async function createExam(teacherId: string, data: {
  name: string;
  type: ExamType;
  subjectId: string;
  semesterId: string;
  maxMarks: number;
  weightage: number;
  examDate: Date;
}) {
  return prisma.exam.create({ data: { ...data, teacherId }, include: { subject: true, semester: true } });
}

export async function updateExam(
  id: string,
  teacherId: string,
  data: Partial<{
    name: string;
    type: ExamType;
    subjectId: string;
    semesterId: string;
    maxMarks: number;
    weightage: number;
    examDate: Date;
  }>
) {
  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Exam not found");
  if (existing.teacherId !== teacherId) throw ApiError.forbidden("You do not own this exam");
  return prisma.exam.update({ where: { id }, data });
}

export async function deleteExam(id: string, teacherId: string) {
  const existing = await prisma.exam.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Exam not found");
  if (existing.teacherId !== teacherId) throw ApiError.forbidden("You do not own this exam");
  await prisma.exam.delete({ where: { id } });
}
