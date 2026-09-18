import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./visitor.service";

export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const { anonymousId, entryPage, deviceCategory } = req.body;
  const session = await svc.startSession(anonymousId, entryPage, deviceCategory);
  return sendSuccess(res, { id: session.id }, 201, "Visitor session started");
});

export const recordPageView = asyncHandler(async (req: Request, res: Response) => {
  await svc.recordPageView(req.body.anonymousId, req.body.path);
  return sendSuccess(res, null, 201, "Page view recorded");
});

export const endSession = asyncHandler(async (req: Request, res: Response) => {
  await svc.endSession(req.body.anonymousId, req.body.exitPage);
  return sendSuccess(res, null, 200, "Visitor session ended");
});

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await svc.getVisitorAnalytics();
  return sendSuccess(res, analytics, 200, "Visitor analytics fetched");
});
