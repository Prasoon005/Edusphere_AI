import { z } from "zod";

export const createAcademicYearSchema = z.object({
  name: z.string().min(4).max(20),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().default(false),
});
export const updateAcademicYearSchema = createAcademicYearSchema.partial();

export const createSemesterSchema = z.object({
  name: z.string().min(1).max(50),
  academicYearId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().default(false),
});
export const updateSemesterSchema = createSemesterSchema.partial();

export const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  credits: z.number().int().min(1).max(10).default(3),
  description: z.string().max(1000).optional(),
});
export const updateSubjectSchema = createSubjectSchema.partial();

export const createClassSchema = z.object({
  name: z.string().min(1).max(100),
  academicYearId: z.string().uuid(),
  subjectIds: z.array(z.string().uuid()).default([]),
});
export const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subjectIds: z.array(z.string().uuid()).optional(),
});

export const createSectionSchema = z.object({
  name: z.string().min(1).max(20),
  classId: z.string().uuid(),
  classTeacherId: z.string().uuid().optional(),
  capacity: z.number().int().min(1).max(300).default(60),
});
export const updateSectionSchema = createSectionSchema.partial().omit({ classId: true });

export const idParamSchema = z.object({ id: z.string().uuid() });

export const assignTeacherSubjectSchema = z.object({
  teacherId: z.string().uuid(),
  subjectId: z.string().uuid(),
});

export const createTimetableSlotSchema = z.object({
  sectionId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm format"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm format"),
  room: z.string().max(50).optional(),
});
