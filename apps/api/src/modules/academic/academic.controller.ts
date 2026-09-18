import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/apiResponse";
import { prisma } from "../../lib/prisma";
import * as svc from "./academic.service";

// Academic Years
export const listAcademicYears = asyncHandler(async (_req: Request, res: Response) => {
  const years = await svc.listAcademicYears();
  return sendSuccess(res, years);
});
export const createAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const year = await svc.createAcademicYear(req.body);
  return sendSuccess(res, year, 201, "Academic year created");
});
export const updateAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const year = await svc.updateAcademicYear(req.params.id, req.body);
  return sendSuccess(res, year, 200, "Academic year updated");
});
export const deleteAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteAcademicYear(req.params.id);
  return sendSuccess(res, null, 200, "Academic year deleted");
});

// Semesters
export const listSemesters = asyncHandler(async (req: Request, res: Response) => {
  const semesters = await svc.listSemesters(req.query.academicYearId as string | undefined);
  return sendSuccess(res, semesters);
});
export const createSemester = asyncHandler(async (req: Request, res: Response) => {
  const semester = await svc.createSemester(req.body);
  return sendSuccess(res, semester, 201, "Semester created");
});
export const updateSemester = asyncHandler(async (req: Request, res: Response) => {
  const semester = await svc.updateSemester(req.params.id, req.body);
  return sendSuccess(res, semester, 200, "Semester updated");
});
export const deleteSemester = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteSemester(req.params.id);
  return sendSuccess(res, null, 200, "Semester deleted");
});

// Subjects
export const listSubjects = asyncHandler(async (_req: Request, res: Response) => {
  const subjects = await svc.listSubjects();
  return sendSuccess(res, subjects);
});
export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const subject = await svc.createSubject(req.body);
  return sendSuccess(res, subject, 201, "Subject created");
});
export const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  const subject = await svc.updateSubject(req.params.id, req.body);
  return sendSuccess(res, subject, 200, "Subject updated");
});
export const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteSubject(req.params.id);
  return sendSuccess(res, null, 200, "Subject deleted");
});

// Classes
export const listClasses = asyncHandler(async (req: Request, res: Response) => {
  const classes = await svc.listClasses(req.query.academicYearId as string | undefined);
  return sendSuccess(res, classes);
});
export const getClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await svc.getClassById(req.params.id);
  return sendSuccess(res, cls);
});
export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await svc.createClass(req.body);
  return sendSuccess(res, cls, 201, "Class created");
});
export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const cls = await svc.updateClass(req.params.id, req.body);
  return sendSuccess(res, cls, 200, "Class updated");
});
export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteClass(req.params.id);
  return sendSuccess(res, null, 200, "Class deleted");
});

// Sections
export const listSections = asyncHandler(async (req: Request, res: Response) => {
  const sections = await svc.listSections(req.query.classId as string | undefined);
  return sendSuccess(res, sections);
});
export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await svc.createSection(req.body);
  return sendSuccess(res, section, 201, "Section created");
});
export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const section = await svc.updateSection(req.params.id, req.body);
  return sendSuccess(res, section, 200, "Section updated");
});
export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteSection(req.params.id);
  return sendSuccess(res, null, 200, "Section deleted");
});

// Teacher <-> Subject
export const assignTeacherSubject = asyncHandler(async (req: Request, res: Response) => {
  const result = await svc.assignTeacherToSubject(req.body.teacherId, req.body.subjectId);
  return sendSuccess(res, result, 201, "Teacher assigned to subject");
});
export const unassignTeacherSubject = asyncHandler(async (req: Request, res: Response) => {
  await svc.unassignTeacherFromSubject(req.body.teacherId, req.body.subjectId);
  return sendSuccess(res, null, 200, "Teacher unassigned from subject");
});

// Timetable
export const getSectionTimetable = asyncHandler(async (req: Request, res: Response) => {
  const timetable = await svc.getTimetableForSection(req.params.sectionId);
  return sendSuccess(res, timetable);
});
export const getMyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const teacher = await prisma.teacher.findUnique({ where: { userId: req.user!.id } });
  if (!teacher) return sendSuccess(res, []);
  const timetable = await svc.getTimetableForTeacher(teacher.id);
  return sendSuccess(res, timetable);
});
export const createTimetableSlot = asyncHandler(async (req: Request, res: Response) => {
  const slot = await svc.createTimetableSlot(req.body);
  return sendSuccess(res, slot, 201, "Timetable slot created");
});
export const deleteTimetableSlot = asyncHandler(async (req: Request, res: Response) => {
  await svc.deleteTimetableSlot(req.params.id);
  return sendSuccess(res, null, 200, "Timetable slot deleted");
});
