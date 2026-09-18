import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createStudyMaterialSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  subjectId: z.string().uuid(),
});

export const listStudyMaterialsQuerySchema = paginationQuerySchema.extend({
  subjectId: z.string().uuid().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
