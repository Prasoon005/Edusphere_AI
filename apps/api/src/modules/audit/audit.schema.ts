import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const listAuditLogsQuerySchema = paginationQuerySchema.extend({
  action: z.string().trim().optional(),
  entity: z.string().trim().optional(),
  userId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
