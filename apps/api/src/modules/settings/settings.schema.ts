import { z } from "zod";

export const upsertSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().min(1).max(5000),
});
