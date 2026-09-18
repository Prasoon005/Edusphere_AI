import { prisma } from "../../lib/prisma";
import { getClassRanking } from "../exams/marks.service";

/** Correlates each student's attendance percentage against their average marks percentage. */
export async function getAttendanceVsMarks(classId: string, semesterId: string) {
  const students = await prisma.student.findMany({
    where: { classId },
    select: { id: true, fullName: true, rollNumber: true },
  });

  const results = await Promise.all(
    students.map(async (s) => {
      const [attendanceRecords, marks] = await Promise.all([
        prisma.attendance.findMany({ where: { studentId: s.id } }),
        prisma.mark.findMany({ where: { studentId: s.id, semesterId }, include: { exam: true } }),
      ]);

      const presentish = attendanceRecords.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
      const attendancePercentage =
        attendanceRecords.length > 0 ? Number(((presentish / attendanceRecords.length) * 100).toFixed(2)) : 0;

      const avgMarksPercentage =
        marks.length > 0
          ? Number(
              (
                marks.reduce((sum, m) => sum + ((m.marksObtained + m.graceMarks) / m.exam.maxMarks) * 100, 0) /
                marks.length
              ).toFixed(2)
            )
          : 0;

      return { studentId: s.id, fullName: s.fullName, rollNumber: s.rollNumber, attendancePercentage, avgMarksPercentage };
    })
  );

  return results;
}

/** Marks trend over successive exams for a subject, averaged across a class. */
export async function getPerformanceTrend(classId: string, subjectId: string) {
  const students = await prisma.student.findMany({ where: { classId }, select: { id: true } });
  const studentIds = students.map((s) => s.id);

  const exams = await prisma.exam.findMany({
    where: { subjectId },
    orderBy: { examDate: "asc" },
  });

  const trend = await Promise.all(
    exams.map(async (exam) => {
      const marks = await prisma.mark.findMany({ where: { examId: exam.id, studentId: { in: studentIds } } });
      const avgPercentage =
        marks.length > 0
          ? Number(
              (
                marks.reduce((sum, m) => sum + ((m.marksObtained + m.graceMarks) / exam.maxMarks) * 100, 0) /
                marks.length
              ).toFixed(2)
            )
          : 0;
      return { examId: exam.id, examName: exam.name, examDate: exam.examDate, avgPercentage, studentCount: marks.length };
    })
  );

  return trend;
}

/** Ranks subjects by class average to surface consistently weak/strong subjects. */
export async function getWeakAndStrongSubjects(classId: string, semesterId: string) {
  const classSubjects = await prisma.classSubject.findMany({
    where: { classId },
    include: { subject: true },
  });
  const students = await prisma.student.findMany({ where: { classId }, select: { id: true } });
  const studentIds = students.map((s) => s.id);

  const subjectAverages = await Promise.all(
    classSubjects.map(async ({ subject }) => {
      const marks = await prisma.mark.findMany({
        where: { subjectId: subject.id, semesterId, studentId: { in: studentIds } },
        include: { exam: true },
      });
      const avgPercentage =
        marks.length > 0
          ? Number(
              (
                marks.reduce((sum, m) => sum + ((m.marksObtained + m.graceMarks) / m.exam.maxMarks) * 100, 0) /
                marks.length
              ).toFixed(2)
            )
          : null;
      return { subjectId: subject.id, subjectName: subject.name, subjectCode: subject.code, avgPercentage };
    })
  );

  const scored = subjectAverages.filter((s) => s.avgPercentage !== null) as Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    avgPercentage: number;
  }>;
  scored.sort((a, b) => a.avgPercentage - b.avgPercentage);

  return {
    weakest: scored.slice(0, 3),
    strongest: scored.slice(-3).reverse(),
    all: scored,
  };
}

export async function getTopStudents(classId: string, semesterId: string, limit = 10) {
  const ranking = await getClassRanking(classId, semesterId);
  return ranking.slice(0, limit);
}

/** Students flagged for either low attendance or low marks in a given semester. */
export async function getRiskStudents(classId: string, semesterId: string) {
  const combined = await getAttendanceVsMarks(classId, semesterId);
  return combined
    .filter((s) => s.attendancePercentage < 75 || s.avgMarksPercentage < 50)
    .map((s) => ({
      ...s,
      reasons: [
        ...(s.attendancePercentage < 75 ? ["Low attendance"] : []),
        ...(s.avgMarksPercentage < 50 ? ["Low marks"] : []),
      ],
    }))
    .sort((a, b) => a.avgMarksPercentage - b.avgMarksPercentage);
}

export async function getClassAnalytics(classId: string, semesterId: string) {
  const [attendanceVsMarks, weakStrong, riskStudents] = await Promise.all([
    getAttendanceVsMarks(classId, semesterId),
    getWeakAndStrongSubjects(classId, semesterId),
    getRiskStudents(classId, semesterId),
  ]);

  const avgAttendance =
    attendanceVsMarks.length > 0
      ? Number((attendanceVsMarks.reduce((sum, s) => sum + s.attendancePercentage, 0) / attendanceVsMarks.length).toFixed(2))
      : 0;
  const avgMarks =
    attendanceVsMarks.length > 0
      ? Number((attendanceVsMarks.reduce((sum, s) => sum + s.avgMarksPercentage, 0) / attendanceVsMarks.length).toFixed(2))
      : 0;

  return {
    studentCount: attendanceVsMarks.length,
    avgAttendance,
    avgMarks,
    weakSubjects: weakStrong.weakest,
    strongSubjects: weakStrong.strongest,
    riskStudentCount: riskStudents.length,
    riskStudents,
  };
}

export async function getDepartmentAnalytics(department: string, semesterId: string) {
  const teachers = await prisma.teacher.findMany({ where: { department }, select: { id: true } });
  const subjectAssignments = await prisma.teacherSubject.findMany({
    where: { teacherId: { in: teachers.map((t) => t.id) } },
    include: { subject: true },
  });
  const subjectIds = [...new Set(subjectAssignments.map((sa) => sa.subjectId))];

  const marks = await prisma.mark.findMany({
    where: { subjectId: { in: subjectIds }, semesterId },
    include: { exam: true },
  });

  const avgPercentage =
    marks.length > 0
      ? Number(
          (
            marks.reduce((sum, m) => sum + ((m.marksObtained + m.graceMarks) / m.exam.maxMarks) * 100, 0) /
            marks.length
          ).toFixed(2)
        )
      : 0;

  return {
    department,
    teacherCount: teachers.length,
    subjectCount: subjectIds.length,
    avgPercentage,
    totalMarkRecords: marks.length,
  };
}
