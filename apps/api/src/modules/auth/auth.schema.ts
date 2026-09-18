import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "New password must contain an uppercase letter")
    .regex(/[a-z]/, "New password must contain a lowercase letter")
    .regex(/[0-9]/, "New password must contain a number")
    .regex(/[^A-Za-z0-9]/, "New password must contain a special character"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "New password must contain an uppercase letter")
    .regex(/[a-z]/, "New password must contain a lowercase letter")
    .regex(/[0-9]/, "New password must contain a number")
    .regex(/[^A-Za-z0-9]/, "New password must contain a special character"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
