import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./password-reset.service";

export const requestReset = asyncHandler(async (req: Request, res: Response) => {
  await svc.requestReset(req.body.email, req.body.reason, req.ip);
  return sendSuccess(
    res,
    null,
    200,
    "If an account exists for that email, an administrator has been notified to verify your request."
  );
});

export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await svc.listRequests(req.query as never);
  return sendSuccess(res, items, 200, "Password reset requests fetched", meta);
});

export const approveRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await svc.approveRequest(req.params.id, req.user!.id, req.ip);
  return sendSuccess(res, request, 200, "Request approved");
});

export const rejectRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await svc.rejectRequest(req.params.id, req.user!.id, req.body.rejectReason, req.ip);
  return sendSuccess(res, request, 200, "Request rejected");
});

export const completeReset = asyncHandler(async (req: Request, res: Response) => {
  await svc.completeReset(req.body.requestId, req.body.token, req.body.newPassword, req.ip);
  return sendSuccess(res, null, 200, "Password reset successfully. Please log in with your new password.");
});
