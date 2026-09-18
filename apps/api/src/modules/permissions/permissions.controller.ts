import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./permissions.service";

export const listPermissions = asyncHandler(async (_req: Request, res: Response) => {
  const permissions = await svc.listPermissions();
  return sendSuccess(res, permissions);
});

export const createPermission = asyncHandler(async (req: Request, res: Response) => {
  const permission = await svc.createPermission(req.body.code, req.body.description);
  return sendSuccess(res, permission, 201, "Permission created");
});

export const deletePermission = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletePermission(req.params.id);
  return sendSuccess(res, null, 200, "Permission deleted");
});

export const listUsersWithRoles = asyncHandler(async (_req: Request, res: Response) => {
  const users = await svc.listUsersWithRoles();
  return sendSuccess(res, users);
});

export const assignPermission = asyncHandler(async (req: Request, res: Response) => {
  const grant = await svc.assignPermission(req.body.userId, req.body.permissionId);
  return sendSuccess(res, grant, 201, "Permission granted");
});

export const revokePermission = asyncHandler(async (req: Request, res: Response) => {
  await svc.revokePermission(req.body.userId, req.body.permissionId);
  return sendSuccess(res, null, 200, "Permission revoked");
});
