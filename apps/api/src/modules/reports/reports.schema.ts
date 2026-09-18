import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const reportCardParamsSchema = z.object({
  studentId: z.string().uuid(),
  semesterId: z.string().uuid(),
});

export const classMarksReportParamsSchema = z.object({
  classId: z.string().uuid(),
  semesterId: z.string().uuid(),
});

export const attendanceReportQuerySchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export const listReportsQuerySchema = paginationQuerySchema;
