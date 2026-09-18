import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  subjectId: z.string().uuid(),
  semesterId: z.string().uuid(),
  maxMarks: z.number().positive().default(100),
  dueDate: z.coerce.date(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const listAssignmentsQuerySchema = paginationQuerySchema.extend({
  subjectId: z.string().uuid().optional(),
  semesterId: z.string().uuid().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).optional(),
});

export const gradeSubmissionSchema = z.object({
  marksObtained: z.number().min(0),
  feedback: z.string().max(2000).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
