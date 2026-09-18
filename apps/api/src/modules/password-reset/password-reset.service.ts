import crypto from "crypto";
import { PasswordResetStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { paginationMeta } from "../../utils/apiResponse";
import { PaginationQuery, toSkipTake } from "../../utils/pagination";
import { hashPassword } from "../../utils/password";
import { createNotification, createNotificationForMany } from "../notifications/notifications.service";
import { logAction } from "../audit/audit.service";

/**
 * Forgot-password / account-recovery workflow. This is DELIBERATELY separate from
 * the self-service `POST /auth/change-password` flow (which needs only the current
 * password): this path is for a user who cannot log in at all and needs an admin
 * to verify their identity before they may set a new password.
 */
export async function requestReset(email: string, reason: string | undefined, ipAddress?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Do not reveal whether the email exists — respond the same way either way.
  if (!user || !user.isActive) return;

  const existingPending = await prisma.passwordResetRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (existingPending) return;

  const request = await prisma.passwordResetRequest.create({
    data: { userId: user.id, reason },
  });

  await logAction({
    userId: user.id,
    action: "PASSWORD_RESET_REQUESTED",
    entity: "PasswordResetRequest",
    entityId: request.id,
    ipAddress,
  });

  const admins = await prisma.user.findMany({ where: { role: Role.SUPER_ADMIN, isActive: true }, select: { id: true } });
  await createNotificationForMany({
    userIds: admins.map((a) => a.id),
    type: "PASSWORD_CHANGE_REQUEST",
    priority: "HIGH",
    title: "Password recovery request",
    message: `${user.email} requested account recovery and needs identity verification.`,
    link: "/admin/password-requests",
  });

  return request;
}

interface ListQuery extends PaginationQuery {
  status?: PasswordResetStatus;
}

export async function listRequests(query: ListQuery) {
  const where: Prisma.PasswordResetRequestWhereInput = {
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.passwordResetRequest.findMany({
      where,
      include: { user: { select: { id: true, email: true, role: true } }, reviewedBy: { select: { email: true } } },
      ...toSkipTake(query),
      orderBy: { requestedAt: "desc" },
    }),
    prisma.passwordResetRequest.count({ where }),
  ]);

  return { items, meta: paginationMeta(query.page, query.limit, total) };
}

export async function approveRequest(id: string, adminId: string, ipAddress?: string) {
  const request = await prisma.passwordResetRequest.findUnique({ where: { id }, include: { user: true } });
  if (!request) throw ApiError.notFound("Request not found");
  if (request.status !== "PENDING") throw ApiError.badRequest("Only pending requests can be approved");

  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h window

  const updated = await prisma.passwordResetRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      reviewedById: adminId,
      reviewedAt: new Date(),
      resetToken,
      tokenExpiresAt,
    },
  });

  await logAction({
    userId: adminId,
    action: "PASSWORD_RESET_APPROVED",
    entity: "PasswordResetRequest",
    entityId: id,
    metadata: { requesterId: request.userId },
    ipAddress,
  });

  await createNotification({
    userId: request.userId,
    type: "PASSWORD_CHANGE_APPROVED",
    priority: "HIGH",
    title: "Password recovery approved",
    message: "Your account recovery request was approved. You may now set a new password.",
    link: `/reset-password?requestId=${id}&token=${resetToken}`,
  });

  // The admin never sees the token/plaintext value beyond what's needed to route the
  // notification — it is only meaningful when paired with the user's own link.
  return updated;
}

export async function rejectRequest(id: string, adminId: string, rejectReason: string | undefined, ipAddress?: string) {
  const request = await prisma.passwordResetRequest.findUnique({ where: { id } });
  if (!request) throw ApiError.notFound("Request not found");
  if (request.status !== "PENDING") throw ApiError.badRequest("Only pending requests can be rejected");

  const updated = await prisma.passwordResetRequest.update({
    where: { id },
    data: { status: "REJECTED", reviewedById: adminId, reviewedAt: new Date(), rejectReason },
  });

  await logAction({
    userId: adminId,
    action: "PASSWORD_RESET_REJECTED",
    entity: "PasswordResetRequest",
    entityId: id,
    metadata: { requesterId: request.userId, rejectReason },
    ipAddress,
  });

  await createNotification({
    userId: request.userId,
    type: "PASSWORD_CHANGE_REJECTED",
    priority: "HIGH",
    title: "Password recovery request rejected",
    message: rejectReason ?? "Your account recovery request could not be verified. Please contact your administrator.",
  });

  return updated;
}

export async function completeReset(requestId: string, token: string, newPassword: string, ipAddress?: string) {
  const request = await prisma.passwordResetRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== "APPROVED" || request.resetToken !== token) {
    throw ApiError.unauthorized("Invalid or expired reset link");
  }
  if (!request.tokenExpiresAt || request.tokenExpiresAt < new Date()) {
    throw ApiError.unauthorized("This reset link has expired. Please submit a new request.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: request.userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({ where: { userId: request.userId, revoked: false }, data: { revoked: true } }),
    prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: { status: "COMPLETED", completedAt: new Date(), resetToken: null },
    }),
  ]);

  await logAction({
    userId: request.userId,
    action: "PASSWORD_RESET_COMPLETED",
    entity: "PasswordResetRequest",
    entityId: requestId,
    ipAddress,
  });
}
