import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  audience: z.enum(["ALL", "TEACHERS", "STUDENTS", "CLASS", "SECTION"]).default("ALL"),
  priority: z.enum(["NORMAL", "IMPORTANT"]).default("NORMAL"),
  sectionId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const updateNoticeSchema = createNoticeSchema.partial();

export const listNoticesQuerySchema = paginationQuerySchema;

export const idParamSchema = z.object({ id: z.string().uuid() });
