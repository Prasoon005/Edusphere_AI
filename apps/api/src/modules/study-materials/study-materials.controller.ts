import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";
import { publicFileUrl } from "../../middleware/upload.middleware";
import * as svc from "./study-materials.service";

async function resolveTeacherId(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw ApiError.forbidden("No teacher profile linked to this account");
  return teacher.id;
}

export const listStudyMaterials = asyncHandler(async (req: Request, res: Response) => {
  let result;
  if (req.user!.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: req.user!.id } });
    if (!student) throw ApiError.forbidden("No student profile linked to this account");
    result = await svc.listStudyMaterialsForStudent(student.id, req.query as never);
  } else {
    result = await svc.listStudyMaterials(req.query as never);
  }
  return sendSuccess(res, result.items, 200, "Study materials fetched", result.meta);
});

export const uploadStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  if (!req.file) throw ApiError.badRequest("A file is required");

  const material = await svc.createStudyMaterial(teacherId, {
    title: req.body.title,
    description: req.body.description,
    subjectId: req.body.subjectId,
    fileUrl: publicFileUrl("materials", req.file.filename),
    fileType: req.file.mimetype,
    fileSizeKb: Math.round(req.file.size / 1024),
  });

  return sendSuccess(res, material, 201, "Study material uploaded");
});

export const deleteStudyMaterial = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = await resolveTeacherId(req.user!.id);
  await svc.deleteStudyMaterial(req.params.id, teacherId);
  return sendSuccess(res, null, 200, "Study material deleted");
});
