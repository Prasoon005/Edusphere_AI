import { prisma } from "../../lib/prisma";
import { getLowAttendanceStudents } from "../attendance/attendance.service";

// ==========================================================
// ATTENDANCE OVERVIEW (Phase 4)
// ==========================================================

export async function getAttendanceOverview(filters: { classId?: string; sectionId?: string; from?: Date; to?: Date }) {
  const dateFilter =
    filters.from || filters.to
      ? { date: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
      : {};

  const studentScope = await prisma.student.findMany({
    where: {
      ...(filters.classId ? { classId: filters.classId } : {}),
      ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
    },
    select: { id: true },
  });
  const studentIds = studentScope.map((s) => s.id);

  const records = await prisma.attendance.findMany({
    where: { studentId: { in: studentIds }, ...dateFilter },
    include: {
      student: { select: { id: true, fullName: true, rollNumber: true, classId: true, sectionId: true } },
      subject: { select: { id: true, name: true } },
      markedBy: { select: { id: true, fullName: true } },
    },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const excused = records.filter((r) => r.status === "EXCUSED").length;
  const overallPercentage = total > 0 ? Number((((present + late) / total) * 100).toFixed(2)) : 0;

  // Class-wise breakdown
  const classMap = new Map<string, { classId: string; className: string; total: number; presentish: number }>();
  const classes = await prisma.class.findMany({ select: { id: true, name: true } });
  const classNameById = new Map(classes.map((c) => [c.id, c.name]));
  for (const r of records) {
    const classId = r.student.classId ?? "unassigned";
    if (!classMap.has(classId)) {
      classMap.set(classId, { classId, className: classNameById.get(classId) ?? "Unassigned", total: 0, presentish: 0 });
    }
    const entry = classMap.get(classId)!;
    entry.total += 1;
    if (r.status === "PRESENT" || r.status === "LATE") entry.presentish += 1;
  }
  const byClass = Array.from(classMap.values()).map((c) => ({
    ...c,
    percentage: c.total > 0 ? Number(((c.presentish / c.total) * 100).toFixed(2)) : 0,
  }));

  // Teacher marking activity — who is marking attendance
  const teacherMap = new Map<string, { teacherId: string; teacherName: string; recordsMarked: number }>();
  for (const r of records) {
    const key = r.markedBy.id;
    if (!teacherMap.has(key)) teacherMap.set(key, { teacherId: key, teacherName: r.markedBy.fullName, recordsMarked: 0 });
    teacherMap.get(key)!.recordsMarked += 1;
  }
  const byTeacher = Array.from(teacherMap.values()).sort((a, b) => b.recordsMarked - a.recordsMarked);

  // Missing attendance — sections with subjects but no records in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sections = await prisma.section.findMany({
    include: { class: { select: { name: true } }, _count: { select: { students: true } } },
  });
  const missingAttendance = [];
  for (const section of sections) {
    if (section._count.students === 0) continue;
    const recentCount = await prisma.attendance.count({
      where: { student: { sectionId: section.id }, date: { gte: sevenDaysAgo } },
    });
    if (recentCount === 0) {
      missingAttendance.push({ sectionId: section.id, sectionName: `${section.class.name} - ${section.name}` });
    }
  }

  const lowAttendanceStudents = await getLowAttendanceStudents(75, {
    classId: filters.classId,
    sectionId: filters.sectionId,
  });

  return {
    summary: { total, present, absent, late, excused, overallPercentage },
    byClass,
    byTeacher,
    missingAttendance,
    lowAttendanceStudents: lowAttendanceStudents.slice(0, 20),
  };
}

// ==========================================================
// ASSIGNMENT OVERVIEW (Phase 5)
// ==========================================================

export async function getAssignmentOverview(filters: { teacherId?: string; subjectId?: string; from?: Date; to?: Date }) {
  const dateFilter =
    filters.from || filters.to
      ? { dueDate: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
      : {};

  const assignments = await prisma.assignment.findMany({
    where: {
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...dateFilter,
    },
    include: {
      teacher: { select: { id: true, fullName: true } },
      subject: { select: { id: true, name: true } },
      submissions: true,
    },
  });

  const total = assignments.length;
  const published = assignments.filter((a) => a.status === "PUBLISHED").length;
  const draft = assignments.filter((a) => a.status === "DRAFT").length;
  const closed = assignments.filter((a) => a.status === "CLOSED").length;

  const allSubmissions = assignments.flatMap((a) => a.submissions);
  const graded = allSubmissions.filter((s) => s.status === "GRADED");
  const late = allSubmissions.filter((s) => s.isLate);
  const pending = allSubmissions.filter((s) => s.status === "PENDING");
  const avgScore =
    graded.length > 0
      ? Number((graded.reduce((sum, s) => sum + (s.marksObtained ?? 0), 0) / graded.length).toFixed(2))
      : 0;

  // Per-teacher table
  const teacherMap = new Map<
    string,
    { teacherId: string; teacherName: string; assignments: number; submissions: number; possibleSubmissions: number }
  >();
  for (const a of assignments) {
    const key = a.teacher.id;
    if (!teacherMap.has(key)) {
      teacherMap.set(key, { teacherId: key, teacherName: a.teacher.fullName, assignments: 0, submissions: 0, possibleSubmissions: 0 });
    }
    const entry = teacherMap.get(key)!;
    entry.assignments += 1;
    entry.submissions += a.submissions.filter((s) => s.status !== "PENDING" && s.status !== "MISSING").length;
  }
  // Estimate possible submissions per teacher's assignment via class size for response %.
  for (const a of assignments) {
    const classSubjects = await prisma.classSubject.findMany({ where: { subjectId: a.subjectId } });
    const studentCount = await prisma.student.count({ where: { classId: { in: classSubjects.map((cs) => cs.classId) } } });
    teacherMap.get(a.teacher.id)!.possibleSubmissions += studentCount;
  }

  const byTeacher = Array.from(teacherMap.values()).map((t) => ({
    ...t,
    responseRate: t.possibleSubmissions > 0 ? Number(((t.submissions / t.possibleSubmissions) * 100).toFixed(1)) : 0,
  }));

  const bySubjectMap = new Map<string, { subjectId: string; subjectName: string; assignments: number }>();
  for (const a of assignments) {
    const key = a.subject.id;
    if (!bySubjectMap.has(key)) bySubjectMap.set(key, { subjectId: key, subjectName: a.subject.name, assignments: 0 });
    bySubjectMap.get(key)!.assignments += 1;
  }

  return {
    summary: {
      total,
      published,
      draft,
      closed,
      totalSubmissions: allSubmissions.length,
      gradedSubmissions: graded.length,
      pendingSubmissions: pending.length,
      lateSubmissions: late.length,
      avgScore,
    },
    byTeacher,
    bySubject: Array.from(bySubjectMap.values()),
  };
}

// ==========================================================
// EXAM OVERVIEW (Phase 6)
// ==========================================================

export async function getExamOverview(filters: { teacherId?: string; subjectId?: string; semesterId?: string }) {
  const exams = await prisma.exam.findMany({
    where: {
      ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(filters.semesterId ? { semesterId: filters.semesterId } : {}),
    },
    include: {
      teacher: { select: { id: true, fullName: true } },
      subject: { select: { id: true, name: true } },
      marks: true,
    },
  });

  const now = new Date();
  const total = exams.length;
  const upcoming = exams.filter((e) => e.examDate > now).length;
  const completed = exams.filter((e) => e.examDate <= now).length;

  const allMarks = exams.flatMap((e) =>
    e.marks.map((m) => ({ ...m, maxMarks: e.maxMarks }))
  );
  const avgMarksPercentage =
    allMarks.length > 0
      ? Number(
          (
            allMarks.reduce((sum, m) => sum + ((m.marksObtained + m.graceMarks) / m.maxMarks) * 100, 0) / allMarks.length
          ).toFixed(2)
        )
      : 0;
  const passCount = allMarks.filter((m) => ((m.marksObtained + m.graceMarks) / m.maxMarks) * 100 >= 40).length;
  const passPercentage = allMarks.length > 0 ? Number(((passCount / allMarks.length) * 100).toFixed(2)) : 0;
  const failPercentage = allMarks.length > 0 ? Number((100 - passPercentage).toFixed(2)) : 0;

  const gradeDistribution: Record<string, number> = {};
  for (const m of allMarks) {
    const grade = m.grade ?? "N/A";
    gradeDistribution[grade] = (gradeDistribution[grade] ?? 0) + 1;
  }

  const teacherMap = new Map<string, { teacherId: string; teacherName: string; exams: number }>();
  for (const e of exams) {
    const key = e.teacher.id;
    if (!teacherMap.has(key)) teacherMap.set(key, { teacherId: key, teacherName: e.teacher.fullName, exams: 0 });
    teacherMap.get(key)!.exams += 1;
  }

  const subjectMap = new Map<string, { subjectId: string; subjectName: string; avgPercentage: number; count: number }>();
  for (const e of exams) {
    for (const m of e.marks) {
      const key = e.subject.id;
      if (!subjectMap.has(key)) subjectMap.set(key, { subjectId: key, subjectName: e.subject.name, avgPercentage: 0, count: 0 });
      const entry = subjectMap.get(key)!;
      const pct = ((m.marksObtained + m.graceMarks) / e.maxMarks) * 100;
      entry.avgPercentage = (entry.avgPercentage * entry.count + pct) / (entry.count + 1);
      entry.count += 1;
    }
  }
  const bySubject = Array.from(subjectMap.values()).map((s) => ({ ...s, avgPercentage: Number(s.avgPercentage.toFixed(2)) }));

  return {
    summary: { total, upcoming, completed, avgMarksPercentage, passPercentage, failPercentage, participants: allMarks.length },
    gradeDistribution,
    byTeacher: Array.from(teacherMap.values()),
    bySubject,
  };
}

// ==========================================================
// ADMIN ASSIGNMENTS LIST (fixes the "empty array" gap)
// ==========================================================

export async function listAllAssignmentsForAdmin(query: {
  page: number;
  limit: number;
  teacherId?: string;
  subjectId?: string;
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
}) {
  const where = {
    ...(query.teacherId ? { teacherId: query.teacherId } : {}),
    ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      include: {
        subject: true,
        semester: true,
        teacher: { select: { id: true, fullName: true } },
        _count: { select: { submissions: true } },
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { dueDate: "desc" },
    }),
    prisma.assignment.count({ where }),
  ]);

  return {
    items,
    meta: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}
