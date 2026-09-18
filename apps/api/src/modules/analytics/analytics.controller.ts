import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./analytics.service";

export const attendanceVsMarks = asyncHandler(async (req: Request, res: Response) => {
  const { classId, semesterId } = req.params;
  const data = await svc.getAttendanceVsMarks(classId, semesterId);
  return sendSuccess(res, data);
});

export const performanceTrend = asyncHandler(async (req: Request, res: Response) => {
  const { classId, subjectId } = req.params;
  const data = await svc.getPerformanceTrend(classId, subjectId);
  return sendSuccess(res, data);
});

export const weakStrongSubjects = asyncHandler(async (req: Request, res: Response) => {
  const { classId, semesterId } = req.params;
  const data = await svc.getWeakAndStrongSubjects(classId, semesterId);
  return sendSuccess(res, data);
});

export const topStudents = asyncHandler(async (req: Request, res: Response) => {
  const { classId, semesterId } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const data = await svc.getTopStudents(classId, semesterId, limit);
  return sendSuccess(res, data);
});

export const riskStudents = asyncHandler(async (req: Request, res: Response) => {
  const { classId, semesterId } = req.params;
  const data = await svc.getRiskStudents(classId, semesterId);
  return sendSuccess(res, data);
});

export const classAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { classId, semesterId } = req.params;
  const data = await svc.getClassAnalytics(classId, semesterId);
  return sendSuccess(res, data);
});

export const departmentAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { department, semesterId } = req.params;
  const data = await svc.getDepartmentAnalytics(department, semesterId);
  return sendSuccess(res, data);
});
