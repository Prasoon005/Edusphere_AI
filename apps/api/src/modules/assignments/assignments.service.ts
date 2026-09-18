import { AssignmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";
import { createNotificationForMany, createNotification } from "../notifications/notifications.service";

interface ListQuery extends PaginationQuery {
  subjectId?: string;
  semesterId?: string;
  status?: AssignmentStatus;
}

export async function listAssignmentsForTeacher(teacherId: string, query: ListQuery) {
  const where: Prisma.AssignmentWhereInput = {
    teacherId,
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    ...(query.semesterId ? { semesterId: query.semesterId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: { subject: true, semester: true, _count: { select: { submissions: true } } },
      ...toSkipTake(query),
      orderBy: { dueDate: "desc" },
    }),
    prisma.assignment.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function listAssignmentsForStudent(studentId: string, query: ListQuery) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student?.classId) return { items: [], meta: paginationMeta(query.page, query.limit, 0) };

  const classSubjects = await prisma.classSubject.findMany({ where: { classId: student.classId } });
  const subjectIds = classSubjects.map((cs) => cs.subjectId);

  const where: Prisma.AssignmentWhereInput = {
    subjectId: { in: subjectIds },
    status: query.status ?? "PUBLISHED",
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    ...(query.semesterId ? { semesterId: query.semesterId } : {}),
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
  };

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: { subject: true, semester: true, teacher: { select: { fullName: true } } },
      ...toSkipTake(query),
      orderBy: { dueDate: "asc" },
    }),
    prisma.assignment.count({ where }),
  ]);

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId, assignmentId: { in: assignments.map((a) => a.id) } },
  });
  const submissionByAssignment = new Map(submissions.map((s) => [s.assignmentId, s]));

  const items = assignments.map((a) => ({
    ...a,
    mySubmission: submissionByAssignment.get(a.id) ?? null,
  }));

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function listAssignmentsForAdmin(query: ListQuery) {
  const where: Prisma.AssignmentWhereInput = {
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    ...(query.semesterId ? { semesterId: query.semesterId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: {
        subject: true,
        semester: true,
        teacher: { select: { id: true, fullName: true } },
        _count: { select: { submissions: true } },
      },
      ...toSkipTake(query),
      orderBy: { dueDate: "desc" },
    }),
    prisma.assignment.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function getAssignmentById(id: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { subject: true, semester: true, teacher: true },
  });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  return assignment;
}

export async function createAssignment(teacherId: string, data: {
  title: string;
  description: string;
  subjectId: string;
  semesterId: string;
  maxMarks: number;
  dueDate: Date;
  status: AssignmentStatus;
}) {
  const assignment = await prisma.assignment.create({
    data: { ...data, teacherId },
    include: { subject: true, semester: true },
  });

  if (assignment.status === "PUBLISHED") {
    await notifyStudentsOfNewAssignment(assignment.id);
  }

  return assignment;
}

async function notifyStudentsOfNewAssignment(assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { subject: true },
  });
  if (!assignment) return;

  const classSubjects = await prisma.classSubject.findMany({ where: { subjectId: assignment.subjectId } });
  const classIds = classSubjects.map((cs) => cs.classId);
  const students = await prisma.student.findMany({
    where: { classId: { in: classIds } },
    select: { userId: true },
  });

  await createNotificationForMany({
    userIds: students.map((s) => s.userId),
    type: "ASSIGNMENT_DUE",
    title: `New assignment: ${assignment.title}`,
    message: `${assignment.subject.name} — due ${assignment.dueDate.toDateString()}`,
    link: `/assignments/${assignment.id}`,
  });
}

export async function updateAssignment(
  id: string,
  teacherId: string,
  data: Partial<{
    title: string;
    description: string;
    subjectId: string;
    semesterId: string;
    maxMarks: number;
    dueDate: Date;
    status: AssignmentStatus;
  }>
) {
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Assignment not found");
  if (existing.teacherId !== teacherId) throw ApiError.forbidden("You do not own this assignment");

  const wasUnpublished = existing.status !== "PUBLISHED";
  const updated = await prisma.assignment.update({ where: { id }, data });

  if (wasUnpublished && updated.status === "PUBLISHED") {
    await notifyStudentsOfNewAssignment(updated.id);
  }

  return updated;
}

export async function deleteAssignment(id: string, teacherId: string) {
  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Assignment not found");
  if (existing.teacherId !== teacherId) throw ApiError.forbidden("You do not own this assignment");
  await prisma.assignment.delete({ where: { id } });
}

export async function listSubmissions(assignmentId: string) {
  return prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: { student: { select: { id: true, fullName: true, rollNumber: true } } },
    orderBy: { student: { rollNumber: "asc" } },
  });
}

export async function submitAssignment(studentId: string, assignmentId: string, fileUrl: string) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw ApiError.notFound("Assignment not found");
  if (assignment.status !== "PUBLISHED") {
    throw ApiError.badRequest("This assignment is not open for submissions");
  }

  const now = new Date();
  const isLate = now > assignment.dueDate;

  return prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    create: {
      assignmentId,
      studentId,
      fileUrl,
      status: isLate ? "LATE" : "SUBMITTED",
      submittedAt: now,
      isLate,
    },
    update: {
      fileUrl,
      status: isLate ? "LATE" : "SUBMITTED",
      submittedAt: now,
      isLate,
    },
  });
}

export async function gradeSubmission(
  submissionId: string,
  marksObtained: number,
  feedback: string | undefined
) {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: true, student: true },
  });
  if (!submission) throw ApiError.notFound("Submission not found");

  if (marksObtained > submission.assignment.maxMarks) {
    throw ApiError.badRequest(`Marks cannot exceed the maximum of ${submission.assignment.maxMarks}`);
  }

  const updated = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: { marksObtained, feedback, status: "GRADED", gradedAt: new Date() },
  });

  await createNotification({
    userId: submission.student.userId,
    type: "MARKS_PUBLISHED",
    title: `Assignment graded: ${submission.assignment.title}`,
    message: `You scored ${marksObtained}/${submission.assignment.maxMarks}`,
    link: `/assignments/${submission.assignmentId}`,
  });

  return updated;
}

export async function getMySubmission(studentId: string, assignmentId: string) {
  return prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId } },
  });
}
