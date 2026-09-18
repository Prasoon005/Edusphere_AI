import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./notifications.service";

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const { items, unreadCount, meta } = await svc.listNotifications(req.user!.id, req.query as never);
  return sendSuccess(res, items, 200, "Notifications fetched", { ...meta, unreadCount });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await svc.markAsRead(req.user!.id, req.params.id);
  return sendSuccess(res, notification, 200, "Marked as read");
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await svc.markAllAsRead(req.user!.id);
  return sendSuccess(res, null, 200, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteNotification(req.user!.id, req.params.id);
  return sendSuccess(res, null, 200, "Notification deleted");
});
