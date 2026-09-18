import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import * as svc from "./students.service";
import { logAction } from "../audit/audit.service";

export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await svc.listStudents(req.query as never);
  return sendSuccess(res, items, 200, "Students fetched", meta);
});

export const getStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await svc.getStudentById(req.params.id);
  return sendSuccess(res, student);
});

export const getMyStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const student = await svc.getStudentByUserId(req.user!.id);
  return sendSuccess(res, student);
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await svc.createStudent(req.body);
  await logAction({ userId: req.user!.id, action: "STUDENT_CREATED", entity: "Student", entityId: student.id, ipAddress: req.ip });
  return sendSuccess(res, student, 201, "Student created");
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const student = await svc.updateStudent(req.params.id, req.body);
  return sendSuccess(res, student, 200, "Student updated");
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteStudent(req.params.id);
  await logAction({ userId: req.user!.id, action: "STUDENT_DELETED", entity: "Student", entityId: req.params.id, ipAddress: req.ip });
  return sendSuccess(res, null, 200, "Student deleted");
});

export const setStudentActive = asyncHandler(async (req: Request, res: Response) => {
  const student = await svc.setStudentActive(req.params.id, req.body.isActive);
  return sendSuccess(res, student, 200, "Student status updated");
});
