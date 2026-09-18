import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./reports.service";

export const generateReportCard = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, semesterId } = req.params;
  const report = await svc.generateReportCardPdf(studentId, semesterId, req.user!.id);
  return sendSuccess(res, report, 201, "Report card generated");
});

export const generateClassMarksReport = asyncHandler(async (req: Request, res: Response) => {
  const { classId, semesterId } = req.params;
  const report = await svc.generateClassMarksExcel(classId, semesterId, req.user!.id);
  return sendSuccess(res, report, 201, "Marks report generated");
});

export const generateAttendanceReport = asyncHandler(async (req: Request, res: Response) => {
  const { classId, subjectId, from, to } = req.query as unknown as {
    classId: string;
    subjectId?: string;
    from: string;
    to: string;
  };
  const report = await svc.generateAttendanceCsv(
    classId,
    { subjectId, from: new Date(from), to: new Date(to) },
    req.user!.id
  );
  return sendSuccess(res, report, 201, "Attendance report generated");
});

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await svc.listReports(
    req.query as never,
    req.query.aboutStudentId as string | undefined
  );
  return sendSuccess(res, items, 200, "Reports fetched", meta);
});

export const getReport = asyncHandler(async (req: Request, res: Response) => {
  const report = await svc.getReportById(req.params.id);
  return sendSuccess(res, report);
});
