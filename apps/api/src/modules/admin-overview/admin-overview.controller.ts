import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./admin-overview.service";

export const attendanceOverview = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getAttendanceOverview(req.query as never);
  return sendSuccess(res, data, 200, "Attendance overview fetched");
});

export const assignmentOverview = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getAssignmentOverview(req.query as never);
  return sendSuccess(res, data, 200, "Assignment overview fetched");
});

export const examOverview = asyncHandler(async (req: Request, res: Response) => {
  const data = await svc.getExamOverview(req.query as never);
  return sendSuccess(res, data, 200, "Exam overview fetched");
});
