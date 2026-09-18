import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import * as svc from "./attendance.service";

async function resolveTeacherId(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw ApiError.forbidden("No teacher profile linked to this account");
  return teacher.id;
}

export const markAttendanceBulk = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const { subjectId, date, records } = req.body;
  const result = await svc.markAttendanceBulk(teacherId, subjectId, date, records);
  return sendSuccess(res, result, 201, "Attendance marked");
});

export const updateAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await svc.updateAttendanceRecord(req.params.id, req.body);
  return sendSuccess(res, record, 200, "Attendance record updated");
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const records = await svc.getStudentAttendance(req.params.studentId, req.query as never);
  return sendSuccess(res, records);
});

export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
  if (!student) throw ApiError.forbidden("No student profile linked to this account");
  const records = await svc.getStudentAttendance(student.id, req.query as never);
  return sendSuccess(res, records);
});

export const getStudentAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await svc.getStudentAttendanceStats(req.params.studentId);
  return sendSuccess(res, stats);
});

export const getMyAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
  if (!student) throw ApiError.forbidden("No student profile linked to this account");
  const stats = await svc.getStudentAttendanceStats(student.id);
  return sendSuccess(res, stats);
});

export const getAttendanceHeatmap = asyncHandler(async (req: Request, res: Response) => {
  const heatmap = await svc.getAttendanceHeatmap(
    req.params.studentId,
    req.query.subjectId as string | undefined
  );
  return sendSuccess(res, heatmap);
});

export const getMyAttendanceHeatmap = asyncHandler(async (req: Request, res: Response) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
  if (!student) throw ApiError.forbidden("No student profile linked to this account");
  const heatmap = await svc.getAttendanceHeatmap(student.id, req.query.subjectId as string | undefined);
  return sendSuccess(res, heatmap);
});

export const getSectionAttendanceForDate = asyncHandler(async (req: Request, res: Response) => {
  const { subjectId, date } = req.query as { subjectId: string; date: string };
  const result = await svc.getSectionAttendanceForDate(req.params.sectionId, subjectId, new Date(date));
  return sendSuccess(res, result);
});

export const getLowAttendanceStudents = asyncHandler(async (req: Request, res: Response) => {
  const { threshold, classId, sectionId } = req.query as unknown as {
    threshold: number;
    classId?: string;
    sectionId?: string;
  };
  const result = await svc.getLowAttendanceStudents(threshold, { classId, sectionId });
  return sendSuccess(res, result);
});
