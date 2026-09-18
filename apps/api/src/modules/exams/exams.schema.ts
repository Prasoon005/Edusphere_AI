import { z } from "zod";

const examTypeEnum = z.enum([
  "INTERNAL",
  "EXTERNAL",
  "QUIZ",
  "LAB",
  "PRACTICAL",
  "VIVA",
  "MIDTERM",
  "FINAL",
]);

export const createExamSchema = z.object({
  name: z.string().min(1).max(150),
  type: examTypeEnum,
  subjectId: z.string().uuid(),
  semesterId: z.string().uuid(),
  maxMarks: z.number().positive().default(100),
  weightage: z.number().positive().max(10).default(1.0),
  examDate: z.coerce.date(),
});

export const updateExamSchema = createExamSchema.partial();

export const enterMarksBulkSchema = z.object({
  examId: z.string().uuid(),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        marksObtained: z.number().min(0),
        graceMarks: z.number().min(0).default(0),
        remarks: z.string().max(500).optional(),
      })
    )
    .min(1),
});

export const updateMarkSchema = z.object({
  marksObtained: z.number().min(0).optional(),
  graceMarks: z.number().min(0).optional(),
  remarks: z.string().max(500).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const studentIdParamSchema = z.object({ studentId: z.string().uuid() });
export const semesterIdParamSchema = z.object({ semesterId: z.string().uuid() });
