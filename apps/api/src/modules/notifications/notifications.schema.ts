import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const listNotificationsQuerySchema = paginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().default(false),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
