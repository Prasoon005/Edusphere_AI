import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./audit.service";

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await svc.listAuditLogs(req.query as never);
  return sendSuccess(res, items, 200, "Audit logs fetched", meta);
});

export const listEntities = asyncHandler(async (_req: Request, res: Response) => {
  const entities = await svc.getDistinctEntities();
  return sendSuccess(res, entities, 200, "Audit log entities fetched");
});
