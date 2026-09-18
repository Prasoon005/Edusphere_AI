import { z } from "zod";

export const createPermissionSchema = z.object({
  code: z.string().min(1).max(100).regex(/^[a-z]+(\.[a-z]+)+$/, "Use dot notation, e.g. 'students.manage'"),
  description: z.string().max(500).optional(),
});

export const assignPermissionSchema = z.object({
  userId: z.string().uuid(),
  permissionId: z.string().uuid(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const userIdParamSchema = z.object({ userId: z.string().uuid() });
