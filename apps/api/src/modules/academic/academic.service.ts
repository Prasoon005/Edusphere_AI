import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";

// ---------- Academic Years ----------

export async function listAcademicYears() {
  return prisma.academicYear.findMany({ orderBy: { startDate: "desc" } });
}

export async function createAcademicYear(data: {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}) {
  if (data.isCurrent) {
    await prisma.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  }
  return prisma.academicYear.create({ data });
}

export async function updateAcademicYear(id: string, data: Partial<{
  name: string; startDate: Date; endDate: Date; isCurrent: boolean;
}>) {
  const existing = await prisma.academicYear.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Academic year not found");

  if (data.isCurrent) {
    await prisma.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  }
  return prisma.academicYear.update({ where: { id }, data });
}

export async function deleteAcademicYear(id: string) {
  const existing = await prisma.academicYear.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Academic year not found");
  await prisma.academicYear.delete({ where: { id } });
}

// ---------- Semesters ----------

export async function listSemesters(academicYearId?: string) {
  return prisma.semester.findMany({
    where: academicYearId ? { academicYearId } : undefined,
    include: { academicYear: true },
    orderBy: { startDate: "desc" },
  });
}

export async function createSemester(data: {
  name: string;
  academicYearId: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}) {
  const year = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
  if (!year) throw ApiError.badRequest("Academic year does not exist");

  if (data.isCurrent) {
    await prisma.semester.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  }
  return prisma.semester.create({ data });
}

export async function updateSemester(id: string, data: Partial<{
  name: string; academicYearId: string; startDate: Date; endDate: Date; isCurrent: boolean;
}>) {
  const existing = await prisma.semester.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Semester not found");

  if (data.isCurrent) {
    await prisma.semester.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
  }
  return prisma.semester.update({ where: { id }, data });
}

export async function deleteSemester(id: string) {
  const existing = await prisma.semester.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Semester not found");
  await prisma.semester.delete({ where: { id } });
}

// ---------- Subjects ----------

export async function listSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}

export async function createSubject(data: {
  name: string;
  code: string;
  credits: number;
  description?: string;
}) {
  const existing = await prisma.subject.findUnique({ where: { code: data.code } });
  if (existing) throw ApiError.conflict(`Subject code '${data.code}' already exists`);
  return prisma.subject.create({ data });
}

export async function updateSubject(id: string, data: Partial<{
  name: string; code: string; credits: number; description: string;
}>) {
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Subject not found");
  return prisma.subject.update({ where: { id }, data });
}

export async function deleteSubject(id: string) {
  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Subject not found");
  await prisma.subject.delete({ where: { id } });
}

// ---------- Classes ----------

export async function listClasses(academicYearId?: string) {
  return prisma.class.findMany({
    where: academicYearId ? { academicYearId } : undefined,
    include: {
      academicYear: true,
      sections: { select: { id: true, name: true, capacity: true } },
      subjects: { include: { subject: true } },
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getClassById(id: string) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      academicYear: true,
      sections: { include: { classTeacher: true, _count: { select: { students: true } } } },
      subjects: { include: { subject: true } },
    },
  });
  if (!cls) throw ApiError.notFound("Class not found");
  return cls;
}

export async function createClass(data: { name: string; academicYearId: string; subjectIds: string[] }) {
  const year = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
  if (!year) throw ApiError.badRequest("Academic year does not exist");

  return prisma.class.create({
    data: {
      name: data.name,
      academicYearId: data.academicYearId,
      subjects: { create: data.subjectIds.map((subjectId) => ({ subjectId })) },
    },
    include: { subjects: { include: { subject: true } } },
  });
}

export async function updateClass(id: string, data: { name?: string; subjectIds?: string[] }) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Class not found");

  return prisma.$transaction(async (tx) => {
    if (data.subjectIds) {
      await tx.classSubject.deleteMany({ where: { classId: id } });
      await tx.classSubject.createMany({
        data: data.subjectIds.map((subjectId) => ({ classId: id, subjectId })),
      });
    }
    return tx.class.update({
      where: { id },
      data: data.name ? { name: data.name } : {},
      include: { subjects: { include: { subject: true } } },
    });
  });
}

export async function deleteClass(id: string) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Class not found");
  await prisma.class.delete({ where: { id } });
}

// ---------- Sections ----------

export async function listSections(classId?: string) {
  return prisma.section.findMany({
    where: classId ? { classId } : undefined,
    include: { classTeacher: true, class: true, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createSection(data: {
  name: string;
  classId: string;
  classTeacherId?: string;
  capacity: number;
}) {
  const cls = await prisma.class.findUnique({ where: { id: data.classId } });
  if (!cls) throw ApiError.badRequest("Class does not exist");

  const existing = await prisma.section.findFirst({ where: { classId: data.classId, name: data.name } });
  if (existing) throw ApiError.conflict(`Section '${data.name}' already exists for this class`);

  return prisma.section.create({ data });
}

export async function updateSection(id: string, data: Partial<{
  name: string; classTeacherId: string; capacity: number;
}>) {
  const existing = await prisma.section.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Section not found");
  return prisma.section.update({ where: { id }, data });
}

export async function deleteSection(id: string) {
  const existing = await prisma.section.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Section not found");
  await prisma.section.delete({ where: { id } });
}

// ---------- Teacher <-> Subject assignment ----------

export async function assignTeacherToSubject(teacherId: string, subjectId: string) {
  const [teacher, subject] = await Promise.all([
    prisma.teacher.findUnique({ where: { id: teacherId } }),
    prisma.subject.findUnique({ where: { id: subjectId } }),
  ]);
  if (!teacher) throw ApiError.badRequest("Teacher does not exist");
  if (!subject) throw ApiError.badRequest("Subject does not exist");

  const existing = await prisma.teacherSubject.findUnique({
    where: { teacherId_subjectId: { teacherId, subjectId } },
  });
  if (existing) throw ApiError.conflict("Teacher is already assigned to this subject");

  return prisma.teacherSubject.create({ data: { teacherId, subjectId }, include: { subject: true, teacher: true } });
}

export async function unassignTeacherFromSubject(teacherId: string, subjectId: string) {
  const existing = await prisma.teacherSubject.findUnique({
    where: { teacherId_subjectId: { teacherId, subjectId } },
  });
  if (!existing) throw ApiError.notFound("Assignment not found");
  await prisma.teacherSubject.delete({ where: { id: existing.id } });
}

// ---------- Timetable ----------

export async function getTimetableForSection(sectionId: string) {
  return prisma.timetableSlot.findMany({
    where: { sectionId },
    include: { subject: true, teacher: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

export async function getTimetableForTeacher(teacherId: string) {
  return prisma.timetableSlot.findMany({
    where: { teacherId },
    include: { subject: true, section: { include: { class: true } } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string) {
  return startA < endB && startB < endA;
}

export async function createTimetableSlot(data: {
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}) {
  if (data.startTime >= data.endTime) {
    throw ApiError.badRequest("startTime must be before endTime");
  }

  const [sectionSlots, teacherSlots] = await Promise.all([
    prisma.timetableSlot.findMany({ where: { sectionId: data.sectionId, dayOfWeek: data.dayOfWeek } }),
    prisma.timetableSlot.findMany({ where: { teacherId: data.teacherId, dayOfWeek: data.dayOfWeek } }),
  ]);

  const sectionConflict = sectionSlots.some((s) => timesOverlap(data.startTime, data.endTime, s.startTime, s.endTime));
  if (sectionConflict) throw ApiError.conflict("This section already has a class scheduled at that time");

  const teacherConflict = teacherSlots.some((s) => timesOverlap(data.startTime, data.endTime, s.startTime, s.endTime));
  if (teacherConflict) throw ApiError.conflict("This teacher already has a class scheduled at that time");

  return prisma.timetableSlot.create({ data, include: { subject: true, teacher: true, section: true } });
}

export async function deleteTimetableSlot(id: string) {
  const existing = await prisma.timetableSlot.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Timetable slot not found");
  await prisma.timetableSlot.delete({ where: { id } });
}
