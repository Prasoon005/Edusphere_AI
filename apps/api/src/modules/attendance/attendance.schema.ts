import { z } from "zod";

const attendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]);

export const markAttendanceBulkSchema = z.object({
  subjectId: z.string().uuid(),
  date: z.coerce.date(),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: attendanceStatusEnum,
        remarks: z.string().max(300).optional(),
      })
    )
    .min(1, "At least one attendance record is required"),
});

export const updateAttendanceSchema = z.object({
  status: attendanceStatusEnum,
  remarks: z.string().max(300).optional(),
});

export const attendanceQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const sectionAttendanceQuerySchema = z.object({
  subjectId: z.string().uuid(),
  date: z.coerce.date(),
});

export const lowAttendanceQuerySchema = z.object({
  threshold: z.coerce.number().min(0).max(100).default(75),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const studentIdParamSchema = z.object({ studentId: z.string().uuid() });
export const sectionIdParamSchema = z.object({ sectionId: z.string().uuid() });
