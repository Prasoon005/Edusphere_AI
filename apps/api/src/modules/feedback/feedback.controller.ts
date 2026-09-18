import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./feedback.service";

export const sendFeedback = asyncHandler(async (req: Request, res: Response) => {
  const feedback = await svc.sendFeedback(req.user!.id, req.body);
  return sendSuccess(res, feedback, 201, "Feedback sent");
});

export const listReceivedFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await svc.listReceivedFeedback(req.user!.id, req.query as never);
  return sendSuccess(res, items, 200, "Feedback fetched", meta);
});

export const listSentFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await svc.listSentFeedback(req.user!.id, req.query as never);
  return sendSuccess(res, items, 200, "Feedback fetched", meta);
});
