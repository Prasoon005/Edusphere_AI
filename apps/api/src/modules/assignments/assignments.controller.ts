import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { publicFileUrl } from "../../middleware/upload.middleware";
import * as svc from "./assignments.service";

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

export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  let result;
  if (req.user!.role === "TEACHER") {
    const teacherId = await resolveTeacherId(req.user!.id);
    result = await svc.listAssignmentsForTeacher(teacherId, req.query as never);
  } else if (req.user!.role === "STUDENT") {
    const studentId = await resolveStudentId(req.user!.id);
    result = await svc.listAssignmentsForStudent(studentId, req.query as never);
  } else {
    // Super admin: cross-teacher view.
    result = await svc.listAssignmentsForAdmin(req.query as never);
  }
  return sendSuccess(res, result.items, 200, "Assignments fetched", result.meta);
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await svc.getAssignmentById(req.params.id);
  return sendSuccess(res, assignment);
});

export const createAssignment = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const assignment = await svc.createAssignment(teacherId, req.body);
  return sendSuccess(res, assignment, 201, "Assignment created");
});

export const updateAssignment = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  const assignment = await svc.updateAssignment(req.params.id, teacherId, req.body);
  return sendSuccess(res, assignment, 200, "Assignment updated");
});

export const deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  await svc.deleteAssignment(req.params.id, teacherId);
  return sendSuccess(res, null, 200, "Assignment deleted");
});

export const listSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const submissions = await svc.listSubmissions(req.params.id);
  return sendSuccess(res, submissions);
});

export const submitAssignment = asyncHandler(async (req: Request, res: Response) => {
  const studentId = await resolveStudentId(req.user!.id);
  if (!req.file) throw ApiError.badRequest("A file is required for submission");
  const fileUrl = publicFileUrl("assignments", req.file.filename);
  const submission = await svc.submitAssignment(studentId, req.params.id, fileUrl);
  return sendSuccess(res, submission, 201, "Assignment submitted");
});

export const getMySubmission = asyncHandler(async (req: Request, res: Response) => {
  const studentId = await resolveStudentId(req.user!.id);
  const submission = await svc.getMySubmission(studentId, req.params.id);
  return sendSuccess(res, submission);
});

export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { marksObtained, feedback } = req.body;
  const submission = await svc.gradeSubmission(req.params.submissionId, marksObtained, feedback);
  return sendSuccess(res, submission, 200, "Submission graded");
});
