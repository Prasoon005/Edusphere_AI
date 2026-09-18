import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { prisma } from "../../lib/prisma";
import { logAction } from "../audit/audit.service";
import * as svc from "./notices.service";

export const createNotice = asyncHandler(async (req: Request, res: Response) => {
  const notice = await svc.createNotice(req.user!.id, req.body);
  await logAction({ userId: req.user!.id, action: "NOTICE_CREATED", entity: "Notice", entityId: notice.id, ipAddress: req.ip });
  return sendSuccess(res, notice, 201, "Notice published");
});

export const updateNotice = asyncHandler(async (req: Request, res: Response) => {
  const notice = await svc.updateNotice(req.params.id, req.body);
  await logAction({ userId: req.user!.id, action: "NOTICE_UPDATED", entity: "Notice", entityId: notice.id, ipAddress: req.ip });
  return sendSuccess(res, notice, 200, "Notice updated");
});

export const listNotices = asyncHandler(async (req: Request, res: Response) => {
  let sectionId: string | null = null;
  let classId: string | null = null;
  if (req.user!.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    sectionId = student?.sectionId ?? null;
    classId = student?.classId ?? null;
  }
  const { items, meta } = await svc.listNoticesForUser(req.user!.role, sectionId, classId, req.query as never);
  return sendSuccess(res, items, 200, "Notices fetched", meta);
});

export const deleteNotice = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteNotice(req.params.id);
  await logAction({ userId: req.user!.id, action: "NOTICE_DELETED", entity: "Notice", entityId: req.params.id, ipAddress: req.ip });
  return sendSuccess(res, null, 200, "Notice deleted");
});
