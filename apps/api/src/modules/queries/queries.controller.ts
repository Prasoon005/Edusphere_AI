import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import * as svc from "./queries.service";

async function resolveTeacherId(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw ApiError.forbidden("No teacher profile linked to this account");
  return teacher.id;
}

async function resolveStudentId(userId: string): Promise<string> {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw ApiError.forbidden("No student profile linked to this account");
  return student.id;
}

export const createQuery = asyncHandler(async (req: Request, res: Response) => {
  const studentId = await resolveStudentId(req.user!.id);
  const query = await svc.createQuery(studentId, req.body);
  return sendSuccess(res, query, 201, "Query submitted");
});

export const listMyQueries = asyncHandler(async (req: Request, res: Response) => {
  const studentId = await resolveStudentId(req.user!.id);
  const { items, meta } = await svc.listMyQueries(studentId, req.query as never);
  return sendSuccess(res, items, 200, "Queries fetched", meta);
});

export const listQueriesForTeacher = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const { items, meta } = await svc.listQueriesForTeacher(teacherId, req.query as never);
  return sendSuccess(res, items, 200, "Queries fetched", meta);
});

export const getQuery = asyncHandler(async (req: Request, res: Response) => {
  const query = await svc.getQueryById(req.params.id);
  return sendSuccess(res, query);
});

export const replyToQuery = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const reply = await svc.replyToQuery(req.params.id, teacherId, req.body.message);
  return sendSuccess(res, reply, 201, "Reply added");
});

export const updateQueryStatus = asyncHandler(async (req: Request, res: Response) => {
  const query = await svc.updateQueryStatus(req.params.id, req.body.status);
  return sendSuccess(res, query, 200, "Query status updated");
});
