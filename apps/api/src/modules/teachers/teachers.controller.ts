import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./teachers.service";
import { logAction } from "../audit/audit.service";

export const listTeachers = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await svc.listTeachers(req.query as never);
  return sendSuccess(res, items, 200, "Teachers fetched", meta);
});

export const getTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await svc.getTeacherById(req.params.id);
  return sendSuccess(res, teacher);
});

export const getMyTeacherProfile = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await svc.getTeacherByUserId(req.user!.id);
  return sendSuccess(res, teacher);
});

export const createTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await svc.createTeacher(req.body);
  await logAction({ userId: req.user!.id, action: "TEACHER_CREATED", entity: "Teacher", entityId: teacher.id, ipAddress: req.ip });
  return sendSuccess(res, teacher, 201, "Teacher created");
});

export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await svc.updateTeacher(req.params.id, req.body);
  return sendSuccess(res, teacher, 200, "Teacher updated");
});

export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteTeacher(req.params.id);
  await logAction({ userId: req.user!.id, action: "TEACHER_DELETED", entity: "Teacher", entityId: req.params.id, ipAddress: req.ip });
  return sendSuccess(res, null, 200, "Teacher deleted");
});

export const setTeacherActive = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await svc.setTeacherActive(req.params.id, req.body.isActive);
  return sendSuccess(res, teacher, 200, "Teacher status updated");
});
