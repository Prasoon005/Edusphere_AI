import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createFeedbackSchema = z.object({
  receiverId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(3000),
  rating: z.number().int().min(1).max(5).optional(),
});

export const listFeedbackQuerySchema = paginationQuerySchema;
