import { z } from "zod";

export const attendanceOverviewQuerySchema = z.object({
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const assignmentOverviewQuerySchema = z.object({
  teacherId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const examOverviewQuerySchema = z.object({
  teacherId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
});
