import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createQuerySchema = z.object({
  subjectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(3000),
});

export const replyToQuerySchema = z.object({
  message: z.string().min(1).max(3000),
});

export const updateQueryStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

export const listQueriesQuerySchema = paginationQuerySchema.extend({
  subjectId: z.string().uuid().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
