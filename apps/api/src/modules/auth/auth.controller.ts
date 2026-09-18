import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { isProd } from "../../config/env";
import * as authService from "./auth.service";

const REFRESH_COOKIE_NAME = "refreshToken";

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body, req.ip);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);

  return sendSuccess(
    res,
    { accessToken: result.accessToken, user: result.user },
    200,
    "Logged in successfully"
  );
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  const tokenFromBody = req.body?.refreshToken as string | undefined;
  const refreshToken = tokenFromCookie ?? tokenFromBody;

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: "Refresh token missing" });
  }

  const tokens = await authService.refreshTokens(refreshToken);
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);

  return sendSuccess(res, { accessToken: tokens.accessToken }, 200, "Token refreshed");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? req.body?.refreshToken;
  await authService.logout(refreshToken, req.user?.id, req.ip);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
  return sendSuccess(res, null, 200, "Logged out successfully");
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAllSessions(req.user!.id, req.ip);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
  return sendSuccess(res, null, 200, "Logged out of all sessions");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  return sendSuccess(res, user, 200, "Current user fetched");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword, req.ip);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
  return sendSuccess(res, null, 200, "Password changed successfully. Please log in again.");
});
