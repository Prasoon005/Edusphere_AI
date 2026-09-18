import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
  reason: z.string().trim().max(500).optional(),
});

export const rejectRequestSchema = z.object({
  rejectReason: z.string().trim().max(500).optional(),
});

export const completeResetSchema = z.object({
  requestId: z.string().uuid(),
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "New password must contain an uppercase letter")
    .regex(/[a-z]/, "New password must contain a lowercase letter")
    .regex(/[0-9]/, "New password must contain a number")
    .regex(/[^A-Za-z0-9]/, "New password must contain a special character"),
});

export const listRequestsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
