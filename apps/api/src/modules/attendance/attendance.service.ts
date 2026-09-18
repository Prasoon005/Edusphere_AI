import { AttendanceStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/apiError";

interface MarkRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export async function markAttendanceBulk(
  markedById: string,
  subjectId: string,
  date: Date,
  records: MarkRecord[]
) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw ApiError.badRequest("Subject does not exist");

  const results = await prisma.$transaction(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { studentId_subjectId_date: { studentId: r.studentId, subjectId, date } },
        create: {
          studentId: r.studentId,
          subjectId,
          date,
          status: r.status,
          remarks: r.remarks,
          markedById,
        },
        update: { status: r.status, remarks: r.remarks, markedById },
      })
    )
  );

  return results;
}

export async function updateAttendanceRecord(
  id: string,
  data: { status: AttendanceStatus; remarks?: string }
) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Attendance record not found");
  return prisma.attendance.update({ where: { id }, data });
}

export async function getStudentAttendance(
  studentId: string,
  filters: { subjectId?: string; from?: Date; to?: Date }
) {
  const where: Prisma.AttendanceWhereInput = {
    studentId,
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.from || filters.to
      ? {
          date: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  return prisma.attendance.findMany({
    where,
    include: { subject: true },
    orderBy: { date: "desc" },
  });
}

export async function getStudentAttendanceStats(studentId: string) {
  const records = await prisma.attendance.findMany({
    where: { studentId },
    include: { subject: { select: { id: true, name: true, code: true } } },
  });

  const bySubject = new Map<
    string,
    { subjectId: string; subjectName: string; total: number; present: number; absent: number; late: number; excused: number }
  >();

  for (const r of records) {
    const key = r.subjectId;
    if (!bySubject.has(key)) {
      bySubject.set(key, {
        subjectId: r.subjectId,
        subjectName: r.subject.name,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      });
    }
    const entry = bySubject.get(key)!;
    entry.total += 1;
    if (r.status === "PRESENT") entry.present += 1;
    else if (r.status === "ABSENT") entry.absent += 1;
    else if (r.status === "LATE") entry.late += 1;
    else if (r.status === "EXCUSED") entry.excused += 1;
  }

  const perSubject = Array.from(bySubject.values()).map((s) => ({
    ...s,
    percentage: s.total > 0 ? Number((((s.present + s.late) / s.total) * 100).toFixed(2)) : 0,
  }));

  const totalClasses = records.length;
  const totalPresentish = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const overallPercentage = totalClasses > 0 ? Number(((totalPresentish / totalClasses) * 100).toFixed(2)) : 0;

  return { overallPercentage, totalClasses, perSubject };
}

export async function getAttendanceHeatmap(studentId: string, subjectId?: string) {
  const records = await prisma.attendance.findMany({
    where: { studentId, ...(subjectId ? { subjectId } : {}) },
    select: { date: true, status: true },
    orderBy: { date: "asc" },
  });
  return records.map((r) => ({ date: r.date.toISOString().slice(0, 10), status: r.status }));
}

export async function getSectionAttendanceForDate(sectionId: string, subjectId: string, date: Date) {
  const students = await prisma.student.findMany({
    where: { sectionId },
    select: { id: true, fullName: true, rollNumber: true },
    orderBy: { rollNumber: "asc" },
  });

  const existing = await prisma.attendance.findMany({
    where: { subjectId, date, student: { sectionId } },
  });
  const existingByStudent = new Map(existing.map((e) => [e.studentId, e]));

  return students.map((s) => {
    const record = existingByStudent.get(s.id);
    return {
      student: s,
      attendance: record ? { id: record.id, status: record.status } : null,
    };
  });
}

export async function getLowAttendanceStudents(
  threshold: number,
  filters: { classId?: string; sectionId?: string }
) {
  const students = await prisma.student.findMany({
    where: {
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
    },
    select: { id: true, fullName: true, rollNumber: true, classId: true, sectionId: true },
  });

  const results: Array<{
    studentId: string;
    fullName: string;
    rollNumber: string;
    percentage: number;
    totalClasses: number;
  }> = [];

  for (const student of students) {
    const records = await prisma.attendance.findMany({ where: { studentId: student.id } });
    if (records.length === 0) continue;
    const presentish = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    const percentage = Number(((presentish / records.length) * 100).toFixed(2));
    if (percentage < threshold) {
      results.push({
        studentId: student.id,
        fullName: student.fullName,
        rollNumber: student.rollNumber,
        percentage,
        totalClasses: records.length,
      });
    }
  }

  return results.sort((a, b) => a.percentage - b.percentage);
}
