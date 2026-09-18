import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import * as examsSvc from "./exams.service";
import * as marksSvc from "./marks.service";
import { logAction } from "../audit/audit.service";
import { createNotificationForMany } from "../notifications/notifications.service";

async function resolveTeacherId(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw ApiError.forbidden("No teacher profile linked to this account");
  return teacher.id;
}

async function resolveStudentId(userId: string): Promise<string> {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw ApiError.forbidden("No student profile linked to this account");
  return student.id;
}

// ---------- Exams ----------

export const listExams = asyncHandler(async (req: Request, res: Response) => {
  const exams = await examsSvc.listExams(req.query as never);
  return sendSuccess(res, exams);
});

export const getExam = asyncHandler(async (req: Request, res: Response) => {
  const exam = await examsSvc.getExamById(req.params.id);
  return sendSuccess(res, exam);
});

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const exam = await examsSvc.createExam(teacherId, req.body);
  await logAction({ userId: req.user!.id, action: "EXAM_CREATED", entity: "Exam", entityId: exam.id, ipAddress: req.ip });

  const classSubjects = await prisma.classSubject.findMany({ where: { subjectId: exam.subjectId } });
  const students = await prisma.student.findMany({
    where: { classId: { in: classSubjects.map((cs) => cs.classId) } },
    select: { userId: true },
  });
  await createNotificationForMany({
    userIds: students.map((s) => s.userId),
    type: "EXAM_SCHEDULED",
    title: `Exam scheduled: ${exam.name}`,
    message: `${exam.subject.name} — ${new Date(exam.examDate).toDateString()}`,
    link: "/marks",
  });

  return sendSuccess(res, exam, 201, "Exam created");
});

export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const exam = await examsSvc.updateExam(req.params.id, teacherId, req.body);
  return sendSuccess(res, exam, 200, "Exam updated");
});

export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  await examsSvc.deleteExam(req.params.id, teacherId);
  return sendSuccess(res, null, 200, "Exam deleted");
});

// ---------- Marks ----------

export const enterMarksBulk = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const { examId, records } = req.body;
  const result = await marksSvc.enterMarksBulk(teacherId, examId, records);
  await logAction({ userId: req.user!.id, action: "MARKS_ENTERED", entity: "Exam", entityId: examId, metadata: { studentCount: records.length }, ipAddress: req.ip });
  return sendSuccess(res, result, 201, "Marks entered");
});

export const updateMark = asyncHandler(async (req: Request, res: Response) => {
  const mark = await marksSvc.updateMark(req.params.id, req.body);
  return sendSuccess(res, mark, 200, "Mark updated");
});

export const getStudentMarks = asyncHandler(async (req: Request, res: Response) => {
  const marks = await marksSvc.getStudentMarks(
    req.params.studentId,
    req.query.semesterId as string | undefined
  );
  return sendSuccess(res, marks);
});

export const getMyMarks = asyncHandler(async (req: Request, res: Response) => {
  const studentId = await resolveStudentId(req.user!.id);
  const marks = await marksSvc.getStudentMarks(studentId, req.query.semesterId as string | undefined);
  return sendSuccess(res, marks);
});

export const getStudentSemesterReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await marksSvc.getStudentSemesterReport(req.params.studentId, req.params.semesterId);
  return sendSuccess(res, report);
});

export const getMySemesterReport = asyncHandler(async (req: Request, res: Response) => {
  const studentId = await resolveStudentId(req.user!.id);
  const report = await marksSvc.getStudentSemesterReport(studentId, req.params.semesterId);
  return sendSuccess(res, report);
});

export const getStudentCGPA = asyncHandler(async (req: Request, res: Response) => {
  const cgpa = await marksSvc.getStudentCGPA(req.params.studentId);
  return sendSuccess(res, cgpa);
});

export const getMyCGPA = asyncHandler(async (req: Request, res: Response) => {
  const studentId = await resolveStudentId(req.user!.id);
  const cgpa = await marksSvc.getStudentCGPA(studentId);
  return sendSuccess(res, cgpa);
});

export const getClassRanking = asyncHandler(async (req: Request, res: Response) => {
  const ranking = await marksSvc.getClassRanking(req.params.classId, req.params.semesterId);
  return sendSuccess(res, ranking);
});
