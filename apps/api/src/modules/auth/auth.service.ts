import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { comparePassword, hashPassword } from "../../utils/password";
import {
  expiryToDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { env } from "../../config/env";
import { LoginInput } from "./auth.schema";
import { logAction } from "../audit/audit.service";

async function loadProfile(userId: string, role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return prisma.admin.findUnique({ where: { userId } });
    case "TEACHER":
      return prisma.teacher.findUnique({ where: { userId } });
    case "STUDENT":
      return prisma.student.findUnique({
        where: { userId },
        include: { class: true, section: true },
      });
    default:
      return null;
  }
}

async function issueTokenPair(userId: string, email: string, role: "SUPER_ADMIN" | "TEACHER" | "STUDENT") {
  const tokenId = uuidv4();
  const accessToken = signAccessToken({ sub: userId, email, role: role as never });
  const refreshToken = signRefreshToken({ sub: userId, tokenId });

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshToken,
      userId,
      expiresAt: expiryToDate(env.JWT_REFRESH_EXPIRY),
    },
  });

  return { accessToken, refreshToken };
}

export async function login(input: LoginInput, ipAddress?: string) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    await logAction({ action: "LOGIN_FAILED", entity: "User", metadata: { email: input.email }, ipAddress });
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    await logAction({ userId: user.id, action: "LOGIN_FAILED", entity: "User", entityId: user.id, ipAddress });
    throw ApiError.unauthorized("Invalid email or password");
  }

  const [{ accessToken, refreshToken }, profile] = await Promise.all([
    issueTokenPair(user.id, user.email, user.role),
    loadProfile(user.id, user.role),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  await logAction({ userId: user.id, action: "LOGIN", entity: "User", entityId: user.id, ipAddress });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      profile,
    },
  };
}

export async function refreshTokens(refreshTokenValue: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenValue);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });

  if (!stored || stored.revoked || stored.token !== refreshTokenValue || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("User no longer active");
  }

  // Rotate: revoke the old refresh token and issue a new pair.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const tokens = await issueTokenPair(user.id, user.email, user.role);

  return tokens;
}

export async function logout(refreshTokenValue: string | undefined, userId?: string, ipAddress?: string) {
  if (!refreshTokenValue) return;
  try {
    const payload = verifyRefreshToken(refreshTokenValue);
    await prisma.refreshToken.updateMany({
      where: { id: payload.tokenId },
      data: { revoked: true },
    });
    await logAction({ userId: userId ?? payload.sub, action: "LOGOUT", entity: "User", entityId: payload.sub, ipAddress });
  } catch {
    // Token already invalid/expired — nothing to revoke, treat as success.
  }
}

export async function logoutAllSessions(userId: string, ipAddress?: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
  await logAction({ userId, action: "LOGOUT_ALL", entity: "User", entityId: userId, ipAddress });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, ipAddress?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const matches = await comparePassword(currentPassword, user.passwordHash);
  if (!matches) throw ApiError.unauthorized("Current password is incorrect");

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } }),
  ]);

  await logAction({ userId, action: "PASSWORD_CHANGED", entity: "User", entityId: userId, ipAddress });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      avatarUrl: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!user) throw ApiError.notFound("User not found");

  const profile = await loadProfile(user.id, user.role);
  return { ...user, profile };
}
