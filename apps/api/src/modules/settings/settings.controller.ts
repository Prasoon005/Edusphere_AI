import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { ApiError } from "../../utils/apiError";
import * as svc from "./settings.service";
import { logAction } from "../audit/audit.service";

export const listSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await svc.listSettings();
  return sendSuccess(res, settings);
});

export const upsertSetting = asyncHandler(async (req: Request, res: Response) => {
  const setting = await svc.upsertSetting(req.body.key, req.body.value);
  await logAction({ userId: req.user!.id, action: "SETTING_CHANGED", entity: "SystemSetting", entityId: setting.key, metadata: { key: setting.key }, ipAddress: req.ip });
  return sendSuccess(res, setting, 200, "Setting saved");
});

export const deleteSetting = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteSetting(req.params.key);
  return sendSuccess(res, null, 200, "Setting deleted");
});

export const createBackup = asyncHandler(async (_req: Request, res: Response) => {
  const backup = await svc.createBackup();
  return sendSuccess(res, backup, 201, "Backup created");
});

export const listBackups = asyncHandler(async (_req: Request, res: Response) => {
  const backups = svc.listBackups();
  return sendSuccess(res, backups);
});

export const downloadBackup = asyncHandler(async (req: Request, res: Response) => {
  const filepath = svc.getBackupFilePath(req.params.filename);
  if (!filepath) throw ApiError.notFound("Backup file not found");
  res.download(filepath);
});
