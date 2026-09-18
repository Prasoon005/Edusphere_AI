import { z } from "zod";

export const startSessionSchema = z.object({
  anonymousId: z.string().min(8).max(100),
  entryPage: z.string().min(1).max(300),
  deviceCategory: z.enum(["DESKTOP", "MOBILE", "TABLET", "OTHER"]).default("OTHER"),
});

export const pageViewSchema = z.object({
  anonymousId: z.string().min(8).max(100),
  path: z.string().min(1).max(300),
});

export const endSessionSchema = z.object({
  anonymousId: z.string().min(8).max(100),
  exitPage: z.string().min(1).max(300).optional(),
});
